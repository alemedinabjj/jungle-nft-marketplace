import { describe, expect, it } from 'vitest'
import { parseSearch, stringifySearch } from './search-serialization'

describe('search serialization', () => {
  it('writes arrays as comma lists and skips empty values', () => {
    expect(
      stringifySearch({ categories: ['music', '3d-art'], q: '', page: 2, maxPrice: '1.5', tab: undefined }),
    ).toBe('?categories=music%2C3d-art&page=2&maxPrice=1.5')
    expect(stringifySearch({})).toBe('')
  })

  it('round-trips through the URL', () => {
    expect(parseSearch(stringifySearch({ q: 'golden ape', networks: ['solana'] }))).toEqual({
      q: 'golden ape',
      networks: 'solana',
    })
  })
})
