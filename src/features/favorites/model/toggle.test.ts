import { describe, expect, it } from 'vitest'
import { toggleFavorite } from './toggle'

describe('toggleFavorite', () => {
  it('adds without duplicating and removes', () => {
    expect(toggleFavorite(['a'], 'b', true)).toEqual(['a', 'b'])
    expect(toggleFavorite(['a', 'b'], 'b', true)).toEqual(['a', 'b'])
    expect(toggleFavorite(['a', 'b'], 'a', false)).toEqual(['b'])
  })
})
