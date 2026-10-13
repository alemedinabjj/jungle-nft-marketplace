import type { Cart, CartItem, EditionId, Quote, QuoteIssue } from '@/shared/contracts'
import { isZeroEth, multiplyEth, percentOfEth, subtractEth, sumEth } from '@/shared/money'
import type { CartRecord, CouponRecord, DbState, NftRecord } from '../../db/types'
import { stableHash } from '../../lib/crypto'

export const NETWORK_FEE = '0.016'

export function findEdition(nft: NftRecord, editionId: EditionId) {
  return nft.editions.find((edition) => edition.id === editionId)
}

/** Max units allowed in the cart for one edition right now. */
export function maxAllowed(nft: NftRecord, editionId: EditionId): number {
  const edition = findEdition(nft, editionId)
  if (!edition) return 0
  return Math.min(edition.available, edition.maxPerOrder)
}

export type CouponCheck = { status: 'applied'; coupon: CouponRecord } | { status: 'invalid' | 'expired' }

export function checkCoupon(coupons: CouponRecord[], code: string, now: number): CouponCheck {
  const coupon = coupons.find((candidate) => candidate.code === code.trim().toUpperCase())
  if (!coupon) return { status: 'invalid' }
  if (Date.parse(coupon.expiresAt) <= now) return { status: 'expired' }
  return { status: 'applied', coupon }
}

export function toCartDto(db: DbState, cart: CartRecord): Cart {
  const items: CartItem[] = []
  for (const line of cart.items) {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!nft || !edition) continue
    items.push({
      nftId: nft.id,
      editionId: line.editionId,
      quantity: line.quantity,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.image,
      unitPrice: nft.price,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
    })
  }
  return { id: cart.id, items, couponCode: cart.couponCode, version: cart.version, updatedAt: cart.updatedAt }
}

const COUPON_MESSAGES = {
  applied: (percent: number) => `Cupom aplicado: ${percent}% de desconto.`,
  invalid: 'Cupom inválido.',
  expired: 'Este cupom expirou.',
} as const

/**
 * Server-side quote. Totals are always computed here (never trusted from the
 * client). The fingerprint changes whenever anything that affects the price
 * or the ability to fulfil the order changes.
 */
export function buildQuote(db: DbState, cart: CartRecord, now: number): Quote {
  const issues: QuoteIssue[] = []
  const lines = cart.items.flatMap((line) => {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!nft || !edition) {
      issues.push({
        nftId: line.nftId,
        editionId: line.editionId,
        kind: 'unavailable',
        message: 'Este item não está mais disponível.',
      })
      return []
    }
    if (edition.available === 0) {
      issues.push({
        nftId: nft.id,
        editionId: line.editionId,
        kind: 'sold-out',
        message: `${nft.name} (${edition.label}) esgotou.`,
      })
    } else if (line.quantity > edition.available) {
      issues.push({
        nftId: nft.id,
        editionId: line.editionId,
        kind: 'quantity-exceeds-stock',
        message: `Restam apenas ${edition.available} unidade(s) de ${nft.name} (${edition.label}).`,
      })
    }
    return [
      {
        nftId: nft.id,
        editionId: line.editionId,
        quantity: line.quantity,
        unitPrice: nft.price,
        lineTotal: multiplyEth(nft.price, line.quantity),
      },
    ]
  })

  const subtotal = sumEth(lines.map((line) => line.lineTotal))
  const couponCheck = cart.couponCode ? checkCoupon(db.coupons, cart.couponCode, now) : null
  const percentOff = couponCheck?.status === 'applied' ? couponCheck.coupon.percentOff : 0
  const discount = percentOfEth(subtotal, percentOff)
  const networkFee = isZeroEth(subtotal) ? '0' : NETWORK_FEE
  const total = sumEth([subtractEth(subtotal, discount), networkFee])

  const coupon =
    cart.couponCode && couponCheck
      ? {
          code: cart.couponCode,
          status: couponCheck.status,
          percentOff,
          message:
            couponCheck.status === 'applied'
              ? COUPON_MESSAGES.applied(percentOff)
              : COUPON_MESSAGES[couponCheck.status],
        }
      : null

  return {
    lines,
    subtotal,
    discount,
    networkFee,
    total,
    coupon,
    issues,
    fingerprint: stableHash({
      lines,
      discount,
      networkFee,
      total,
      coupon: coupon?.status ?? null,
      issues: issues.map((issue) => issue.kind),
    }),
    computedAt: new Date(now).toISOString(),
  }
}
