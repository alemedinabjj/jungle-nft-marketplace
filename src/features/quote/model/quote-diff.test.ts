import { describe, expect, it } from 'vitest'
import type { Quote } from '@/shared/contracts'
import { canConfirm, describeQuoteChanges, isQuoteStale } from './quote-diff'

const base: Quote = {
  lines: [{ nftId: 'nft-001', editionId: 'open', quantity: 2, unitPrice: '1.19', lineTotal: '2.38' }],
  subtotal: '2.38',
  discount: '0',
  networkFee: '0.016',
  total: '2.396',
  coupon: null,
  issues: [],
  fingerprint: 'fp-1',
  computedAt: '2026-10-13T12:00:00.000Z',
}

describe('quote diff', () => {
  it('detects a stale reviewed quote by fingerprint', () => {
    expect(isQuoteStale(base, base)).toBe(false)
    expect(isQuoteStale(base, { ...base, fingerprint: 'fp-2' })).toBe(true)
    expect(isQuoteStale(null, base)).toBe(true)
  })

  it('describes price, total and fee changes in plain language', () => {
    const next: Quote = {
      ...base,
      lines: [{ ...base.lines[0]!, unitPrice: '1.44', lineTotal: '2.88' }],
      subtotal: '2.88',
      total: '2.896',
      fingerprint: 'fp-2',
    }
    expect(describeQuoteChanges(base, next, { 'nft-001': 'Emerald Ape #042' })).toEqual([
      'Emerald Ape #042: preço de 1.19 ETH para 1.44 ETH',
      'Total: de 2.396 ETH para 2.896 ETH',
    ])
  })

  it('blocks confirmation when there are stock issues or an unapplied coupon', () => {
    expect(canConfirm(base)).toBe(true)
    expect(
      canConfirm({
        ...base,
        issues: [{ nftId: 'nft-001', editionId: 'open', kind: 'sold-out', message: 'x' }],
      }),
    ).toBe(false)
    expect(canConfirm({ ...base, lines: [] })).toBe(false)
    expect(
      canConfirm({ ...base, coupon: { code: 'X', status: 'expired', percentOff: 0, message: 'x' } }),
    ).toBe(false)
  })
})
