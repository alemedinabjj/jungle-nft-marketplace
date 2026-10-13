import { delay, http, HttpResponse } from 'msw'
import { createOrderRequestSchema, IDEMPOTENCY_KEY_HEADER, type Order } from '@/shared/contracts'
import { REQUEST_TIMEOUT_MS } from '@/shared/http'
import { addEth } from '@/shared/money'
import { mutateDb } from '../../db/store'
import type { OrderRecord } from '../../db/types'
import { randomId, stableHash } from '../../lib/crypto'
import { API, apiError, applyScenario, nowIso, readJson, requireUser, validationError } from '../../lib/http'
import { getScenario } from '../../scenarios/controller'
import { emitNftUpdated } from '../../socket/events'
import { buildQuote, findEdition, toCartDto } from '../cart/pricing'
import { getOrCreateCart } from '../cart/handlers'
import { scheduleSettlement } from './process'

/** One-shot checkout disruptions per user (price change / sold out), reset with the db. */
const disruptedUsers = new Set<string>()
export function resetCheckoutDisruptions(): void {
  disruptedUsers.clear()
}

export function toOrderDto({
  userId: _userId,
  collectorFull: _collector,
  purchased: _purchased,
  ...order
}: OrderRecord): Order {
  return order
}

export const orderHandlers = [
  http.post(`${API}/orders`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    await applyScenario('orders', request)

    const key = request.headers.get(IDEMPOTENCY_KEY_HEADER)
    if (!key || key.length < 16) {
      return apiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key ausente ou inválido.')
    }
    const body = await readJson(request)
    const parsed = createOrderRequestSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)
    const requestHash = stableHash(parsed.data)
    const userId = auth.user.id
    const scenario = getScenario()

    // Idempotency: same key → same order; same key + different payload → 409.
    const replay = auth.db.idempotency.find((record) => record.key === key && record.userId === userId)
    if (replay) {
      if (replay.requestHash !== requestHash) {
        return apiError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Esta tentativa de compra já foi usada com outros dados.',
        )
      }
      const order = auth.db.orders.find((candidate) => candidate.id === replay.orderId)!
      return HttpResponse.json(toOrderDto(order), { status: 200 })
    }

    // Scenario-driven disruption happens "between" the quote and the confirmation.
    if (
      (scenario.checkout === 'price-change' || scenario.checkout === 'sold-out') &&
      !disruptedUsers.has(userId)
    ) {
      disruptedUsers.add(userId)
      await mutateDb((db) => {
        const line = getOrCreateCart(db, `user:${userId}`).items[0]
        const nft = line && db.nfts.find((candidate) => candidate.id === line.nftId)
        if (!line || !nft) return
        if (scenario.checkout === 'price-change') {
          nft.price = addEth(nft.price, '0.25')
        } else {
          findEdition(nft, line.editionId)!.available = 0
        }
        emitNftUpdated(db, nft)
      })
    }

    const result = await mutateDb((db) => {
      const cart = getOrCreateCart(db, `user:${userId}`)
      if (cart.items.length === 0) return apiError(409, 'CART_EMPTY', 'Seu carrinho está vazio.')
      const quote = buildQuote(db, cart, Date.now())
      if (quote.issues.length > 0) {
        return apiError(409, 'INSUFFICIENT_STOCK', quote.issues.map((issue) => issue.message).join(' '))
      }
      if (quote.fingerprint !== parsed.data.quoteFingerprint) {
        return apiError(
          409,
          'QUOTE_CHANGED',
          'Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.',
        )
      }
      const wallet = db.wallets[userId]?.find((candidate) => candidate.id === parsed.data.walletId)
      if (!wallet) {
        return apiError(422, 'WALLET_NOT_FOUND', 'Selecione uma carteira cadastrada.', {
          walletId: 'Selecione uma carteira cadastrada.',
        })
      }
      if (wallet.status !== 'connected') {
        return apiError(409, 'WALLET_DISCONNECTED', 'Conecte a carteira antes de confirmar.', {
          walletId: 'Carteira desconectada.',
        })
      }

      const cartDto = toCartDto(db, cart)
      const now = nowIso()
      const order: OrderRecord = {
        id: randomId('ord'),
        userId,
        status: 'pending',
        lines: cartDto.items.map((item) => {
          const line = quote.lines.find(
            (candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId,
          )!
          return {
            nftId: item.nftId,
            editionId: item.editionId,
            name: item.name,
            tokenId: item.tokenId,
            image: item.image,
            quantity: item.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          }
        }),
        subtotal: quote.subtotal,
        discount: quote.discount,
        networkFee: quote.networkFee,
        total: quote.total,
        couponCode: quote.coupon?.status === 'applied' ? quote.coupon.code : null,
        network: parsed.data.network,
        wallet: { provider: wallet.provider, address: parsed.data.alternateAddress ?? wallet.address },
        collector: {
          displayName: parsed.data.collector.displayName,
          username: parsed.data.collector.username,
          email: parsed.data.collector.email,
        },
        collectorFull: parsed.data.collector,
        purchased: cart.items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity })),
        transactionId: null,
        rejectionReason: null,
        createdAt: now,
        updatedAt: now,
        version: 1,
      }
      db.orders.push(order)
      db.idempotency.push({ key, userId, requestHash, orderId: order.id })
      return order
    })

    if (result instanceof Response) return result
    scheduleSettlement(result.id)

    if (scenario.checkout === 'timeout-after-create') {
      // The order exists, but the response arrives after the client gave up.
      await delay(REQUEST_TIMEOUT_MS + 2_000)
    }
    return HttpResponse.json(toOrderDto(result), { status: 201 })
  }),

  http.get(`${API}/orders`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    await applyScenario('orders', request)
    const status = new URL(request.url).searchParams.get('status')
    const orders = auth.db.orders
      .filter((order) => order.userId === auth.user.id && (!status || order.status === status))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(toOrderDto)
    return HttpResponse.json(orders)
  }),

  http.get(`${API}/orders/:id`, async ({ request, params }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    await applyScenario('orders', request)
    const order = auth.db.orders.find(
      (candidate) => candidate.id === params.id && candidate.userId === auth.user.id,
    )
    if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    return HttpResponse.json(toOrderDto(order))
  }),
]
