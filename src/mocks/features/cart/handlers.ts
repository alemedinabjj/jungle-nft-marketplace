import { http, HttpResponse } from 'msw'
import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  editionIdSchema,
  GUEST_ID_HEADER,
  updateCartItemRequestSchema,
  type EditionId,
} from '@/shared/contracts'
import { getDb, mutateDb } from '../../db/store'
import type { CartRecord, DbState } from '../../db/types'
import { randomId } from '../../lib/crypto'
import {
  API,
  apiError,
  applyScenario,
  bearerToken,
  nowIso,
  readJson,
  requireUser,
  validationError,
} from '../../lib/http'
import { buildQuote, checkCoupon, findEdition, maxAllowed, toCartDto } from './pricing'

type Owner = { ok: true; key: string; userId: string | null } | { ok: false; response: Response }

/** Authenticated users own `user:<id>` carts; guests own `guest:<id>` via header. */
async function resolveOwner(request: Request): Promise<Owner> {
  if (bearerToken(request)) {
    const auth = await requireUser(request)
    if (!auth.ok) return auth
    return { ok: true, key: `user:${auth.user.id}`, userId: auth.user.id }
  }
  const guestId = request.headers.get(GUEST_ID_HEADER)
  if (!guestId || !/^gst_[a-z0-9]{8,32}$/i.test(guestId)) {
    return { ok: false, response: apiError(400, 'GUEST_ID_REQUIRED', 'Identificador do carrinho ausente.') }
  }
  return { ok: true, key: `guest:${guestId}`, userId: null }
}

export function getOrCreateCart(db: DbState, ownerKey: string): CartRecord {
  let cart = db.carts.find((candidate) => candidate.ownerKey === ownerKey)
  if (!cart) {
    cart = { id: randomId('cart'), ownerKey, items: [], couponCode: null, version: 1, updatedAt: nowIso() }
    db.carts.push(cart)
  }
  return cart
}

function touch(cart: CartRecord): void {
  cart.version += 1
  cart.updatedAt = nowIso()
}

function stockError(available: number, max: number) {
  const limit = Math.min(available, max)
  return apiError(
    409,
    'INSUFFICIENT_STOCK',
    limit === 0
      ? 'Esta edição está esgotada.'
      : `Você pode adicionar no máximo ${limit} unidade(s) desta edição.`,
    { quantity: limit === 0 ? 'Edição esgotada.' : `Máximo de ${limit} unidade(s).` },
  )
}

/** Merge guest lines into the user cart, clamping each line to the allowed maximum. */
export function mergeCarts(db: DbState, target: CartRecord, source: CartRecord): void {
  for (const line of source.items) {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    if (!nft) continue
    const limit = maxAllowed(nft, line.editionId)
    const existing = target.items.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    const quantity = Math.min((existing?.quantity ?? 0) + line.quantity, limit)
    if (quantity <= 0) continue
    if (existing) existing.quantity = quantity
    else target.items.push({ ...line, quantity })
  }
  target.couponCode ??= source.couponCode
  touch(target)
}

function lineParams(params: Record<string, unknown>): { nftId: string; editionId: EditionId } | null {
  const editionId = editionIdSchema.safeParse(params.editionId)
  return editionId.success ? { nftId: String(params.nftId), editionId: editionId.data } : null
}

export const cartHandlers = [
  http.get(`${API}/cart`, async ({ request }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('cart', request)
    if (failure) return failure
    return HttpResponse.json(await mutateDb((db) => toCartDto(db, getOrCreateCart(db, owner.key))))
  }),

  http.get(`${API}/cart/quote`, async ({ request }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('quote', request)
    if (failure) return failure
    return HttpResponse.json(
      await mutateDb((db) => buildQuote(db, getOrCreateCart(db, owner.key), Date.now())),
    )
  }),

  http.post(`${API}/cart/items`, async ({ request }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('cart', request)
    if (failure) return failure
    const parsed = addCartItemRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const { nftId, editionId, quantity } = parsed.data
    const db = await getDb()
    const nft = db.nfts.find((candidate) => candidate.id === nftId)
    const edition = nft && findEdition(nft, editionId)
    if (!nft || !edition) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT ou edição não existe.')
    const cart = getOrCreateCart(db, owner.key)
    const existing = cart.items.find((item) => item.nftId === nftId && item.editionId === editionId)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > maxAllowed(nft, editionId)) return stockError(edition.available, edition.maxPerOrder)
    return HttpResponse.json(
      await mutateDb((state) => {
        if (existing) existing.quantity = nextQuantity
        else cart.items.push({ nftId, editionId, quantity })
        touch(cart)
        return toCartDto(state, cart)
      }),
      { status: 201 },
    )
  }),

  http.patch(`${API}/cart/items/:nftId/:editionId`, async ({ request, params }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('cart', request)
    if (failure) return failure
    const line = lineParams(params)
    const parsed = updateCartItemRequestSchema.safeParse(await readJson(request))
    if (!line || !parsed.success) return validationError(parsed.success ? [] : parsed.error.issues)
    const db = await getDb()
    const cart = getOrCreateCart(db, owner.key)
    const item = cart.items.find(
      (candidate) => candidate.nftId === line.nftId && candidate.editionId === line.editionId,
    )
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!item || !nft || !edition)
      return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.')
    if (parsed.data.quantity > maxAllowed(nft, line.editionId))
      return stockError(edition.available, edition.maxPerOrder)
    return HttpResponse.json(
      await mutateDb((state) => {
        item.quantity = parsed.data.quantity
        touch(cart)
        return toCartDto(state, cart)
      }),
    )
  }),

  http.delete(`${API}/cart/items/:nftId/:editionId`, async ({ request, params }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('cart', request)
    if (failure) return failure
    const line = lineParams(params)
    if (!line) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.')
    return HttpResponse.json(
      await mutateDb((db) => {
        const cart = getOrCreateCart(db, owner.key)
        cart.items = cart.items.filter(
          (item) => !(item.nftId === line.nftId && item.editionId === line.editionId),
        )
        touch(cart)
        return toCartDto(db, cart)
      }),
    )
  }),

  http.post(`${API}/cart/coupon`, async ({ request }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    const failure = await applyScenario('cart', request)
    if (failure) return failure
    const parsed = applyCouponRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const db = await getDb()
    const check = checkCoupon(db.coupons, parsed.data.code, Date.now())
    if (check.status !== 'applied') {
      return check.status === 'invalid'
        ? apiError(422, 'COUPON_INVALID', 'Cupom inválido.', {
            code: 'Este código não existe. Confira e tente de novo.',
          })
        : apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este código expirou.' })
    }
    const { coupon } = check
    return HttpResponse.json(
      await mutateDb((state) => {
        const cart = getOrCreateCart(state, owner.key)
        cart.couponCode = coupon.code
        touch(cart)
        return toCartDto(state, cart)
      }),
    )
  }),

  http.delete(`${API}/cart/coupon`, async ({ request }) => {
    const owner = await resolveOwner(request)
    if (!owner.ok) return owner.response
    await applyScenario('cart', request)
    return HttpResponse.json(
      await mutateDb((db) => {
        const cart = getOrCreateCart(db, owner.key)
        cart.couponCode = null
        touch(cart)
        return toCartDto(db, cart)
      }),
    )
  }),

  /** Called right after login: guest lines are merged into the user's cart. */
  http.post(`${API}/cart/merge`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    await applyScenario('cart', request)
    const guestId = request.headers.get(GUEST_ID_HEADER)
    return HttpResponse.json(
      await mutateDb((db) => {
        const target = getOrCreateCart(db, `user:${auth.user.id}`)
        const source = guestId ? db.carts.find((cart) => cart.ownerKey === `guest:${guestId}`) : undefined
        if (source && source.items.length > 0) {
          mergeCarts(db, target, source)
          db.carts = db.carts.filter((cart) => cart !== source)
        }
        return toCartDto(db, target)
      }),
    )
  }),
]
