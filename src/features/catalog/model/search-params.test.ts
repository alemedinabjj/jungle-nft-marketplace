import { describe, expect, it } from 'vitest'
import {
  catalogSearchSchema,
  hasActiveFilters,
  toCatalogQuery,
  toggleValue,
  withFilters,
  withPage,
} from './search-params'

describe('catalogSearchSchema', () => {
  it('drops invalid values instead of failing', () => {
    const parsed = catalogSearchSchema.parse({
      categories: 'music,not-a-category',
      networks: ['solana', 'bitcoin'],
      minPrice: '-3',
      sort: 'nope',
      page: 'abc',
    })
    expect(parsed).toEqual({ categories: ['music'], networks: ['solana'] })
  })

  it('accepts numbers serialized by the router for prices', () => {
    expect(catalogSearchSchema.parse({ maxPrice: 1.5 }).maxPrice).toBe('1.5')
  })
})

describe('toCatalogQuery', () => {
  it('normalizes equivalent URLs into the same query (stable cache key)', () => {
    const a = toCatalogQuery({ categories: ['music', 'digital-art', 'music'], q: '  ape ' })
    const b = toCatalogQuery({ categories: ['digital-art', 'music'], q: 'ape' })
    expect(a).toEqual(b)
    expect(a).toEqual({
      q: 'ape',
      categories: ['digital-art', 'music'],
      tab: 'all',
      sort: 'recent',
      page: 1,
      pageSize: 9,
    })
  })

  it('swaps an inverted price range', () => {
    expect(toCatalogQuery({ minPrice: '5', maxPrice: '1' })).toMatchObject({ minPrice: '1', maxPrice: '5' })
  })
})

describe('withFilters', () => {
  it('resets to page 1 on any filter change and drops defaults', () => {
    expect(withFilters({ page: 4, q: 'ape' }, { sort: 'price-asc' })).toEqual({
      q: 'ape',
      sort: 'price-asc',
      page: undefined,
    })
    expect(withFilters({ page: 2, tab: 'new' }, { tab: 'all', categories: [] })).toEqual({
      page: undefined,
      tab: undefined,
      categories: undefined,
    })
  })

  it('keeps page changes isolated', () => {
    expect(withPage({ q: 'x' }, 3)).toEqual({ q: 'x', page: 3 })
    expect(withPage({ q: 'x', page: 3 }, 1)).toEqual({ q: 'x', page: undefined })
  })

  it('toggles multi-select values and reports active filters', () => {
    expect(toggleValue(['music'], 'music')).toEqual([])
    expect(toggleValue(undefined, 'music')).toEqual(['music'])
    expect(hasActiveFilters({ sort: 'popular' })).toBe(false)
    expect(hasActiveFilters({ networks: ['solana'] })).toBe(true)
  })
})
