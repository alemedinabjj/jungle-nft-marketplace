import { describe, expect, it } from 'vitest'
import { clampQuantity, itemCount, lineKey, lineProblem, maxQuantity } from './cart'

describe('cart rules', () => {
  const item = { available: 4, maxPerOrder: 5 }

  it('limits quantity by stock and per-order cap', () => {
    expect(maxQuantity(item)).toBe(4)
    expect(maxQuantity({ available: 30, maxPerOrder: 10 })).toBe(10)
    expect(maxQuantity({ available: 0, maxPerOrder: 10 })).toBe(0)
  })

  it('clamps to integers within [1, max]', () => {
    expect(clampQuantity(9, item)).toBe(4)
    expect(clampQuantity(0, item)).toBe(1)
    expect(clampQuantity(2.7, item)).toBe(2)
    expect(clampQuantity(Number.NaN, item)).toBe(1)
  })

  it('counts units and builds stable line keys', () => {
    expect(itemCount([{ quantity: 2 }, { quantity: 6 }, { quantity: 9 }])).toBe(17)
    expect(lineKey({ nftId: 'nft-001', editionId: '1-of-10' })).toBe('nft-001:1-of-10')
  })

  it('reports stock problems', () => {
    expect(lineProblem({ quantity: 2, available: 0 })).toBe('sold-out')
    expect(lineProblem({ quantity: 5, available: 3 })).toBe('exceeds-stock')
    expect(lineProblem({ quantity: 2, available: 3 })).toBeNull()
  })
})
