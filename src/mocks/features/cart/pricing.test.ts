import { beforeEach, describe, expect, it } from 'vitest'
import { createSeedState } from '../../db/seed'
import type { CartRecord, DbState } from '../../db/types'
import { buildQuote, checkCoupon } from './pricing'

let db: DbState
const NOW = Date.UTC(2026, 9, 13)

function cart(items: CartRecord['items'], couponCode: string | null = null): CartRecord {
  return {
    id: 'cart_1',
    ownerKey: 'user:usr_ana',
    items,
    couponCode,
    version: 1,
    updatedAt: new Date(NOW).toISOString(),
  }
}

beforeEach(async () => {
  db = await createSeedState()
})

describe('buildQuote', () => {
  it('reproduces the Figma cart summary exactly (no float drift)', () => {
    // Emerald Ape ×2, Violet Nomad ×6, Ivory Baron ×9 → 26.83 + 0.016 fee
    const quote = buildQuote(
      db,
      cart([
        { nftId: 'nft-001', editionId: 'open', quantity: 2 },
        { nftId: 'nft-005', editionId: 'open', quantity: 6 },
        { nftId: 'nft-006', editionId: 'open', quantity: 9 },
      ]),
      NOW,
    )
    expect(quote.subtotal).toBe('26.83')
    expect(quote.discount).toBe('0')
    expect(quote.networkFee).toBe('0.016')
    expect(quote.total).toBe('26.846')
    expect(quote.issues).toEqual([])
  })

  it('applies a valid coupon and reports invalid / expired ones', () => {
    const items = [{ nftId: 'nft-001', editionId: 'open' as const, quantity: 1 }]
    expect(buildQuote(db, cart(items, 'KURIO10'), NOW)).toMatchObject({
      discount: '0.119',
      total: '1.087',
      coupon: { status: 'applied' },
    })
    expect(buildQuote(db, cart(items, 'LAUNCH24'), NOW).coupon?.status).toBe('expired')
    expect(buildQuote(db, cart(items, 'NOPE'), NOW)).toMatchObject({
      discount: '0',
      coupon: { status: 'invalid' },
    })
  })

  it('flags stock problems and changes the fingerprint when price changes', () => {
    const items = [{ nftId: 'nft-002', editionId: '1-of-10' as const, quantity: 3 }]
    const before = buildQuote(db, cart(items), NOW)
    db.nfts[1]!.price = '1.79'
    const after = buildQuote(db, cart(items), NOW)
    expect(after.fingerprint).not.toBe(before.fingerprint)

    db.nfts[1]!.editions[1]!.available = 0
    expect(buildQuote(db, cart(items), NOW).issues[0]?.kind).toBe('sold-out')
  })

  it('charges no network fee on an empty cart', () => {
    expect(buildQuote(db, cart([]), NOW)).toMatchObject({ subtotal: '0', networkFee: '0', total: '0' })
  })
})

describe('checkCoupon', () => {
  it('is case-insensitive', () => {
    expect(checkCoupon(db.coupons, 'kurio10', NOW).status).toBe('applied')
  })
})
