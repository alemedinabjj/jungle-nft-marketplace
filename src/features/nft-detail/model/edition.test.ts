import { describe, expect, it } from 'vitest'
import { defaultEdition, remainingForEdition } from './edition'

describe('edition helpers', () => {
  it('prefers 1/50 and falls back to an edition with stock', () => {
    expect(
      defaultEdition([
        { id: '1-of-1', label: '1/1', supply: 1, available: 0, maxPerOrder: 1 },
        { id: '1-of-10', label: '1/10', supply: 10, available: 3, maxPerOrder: 5 },
      ]),
    ).toBe('1-of-10')
    expect(
      defaultEdition([
        { id: '1-of-1', label: '1/1', supply: 1, available: 1, maxPerOrder: 1 },
        { id: '1-of-50', label: '1/50', supply: 50, available: 20, maxPerOrder: 10 },
      ]),
    ).toBe('1-of-50')
  })

  it('subtracts what is already in the cart', () => {
    expect(remainingForEdition({ available: 3, maxPerOrder: 5 }, 1)).toBe(2)
    expect(remainingForEdition({ available: 30, maxPerOrder: 10 }, 12)).toBe(0)
  })
})
