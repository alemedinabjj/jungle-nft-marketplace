import { describe, expect, it } from 'vitest'
import type { CatalogQuery } from '@/shared/contracts'
import { compareEth } from '@/shared/money'
import { buildNftFixtures } from '../../fixtures/nfts'
import { queryCatalog } from './query'

const nfts = buildNftFixtures()
const base: CatalogQuery = { tab: 'all', sort: 'recent', page: 1, pageSize: 9 }

describe('queryCatalog', () => {
  it('returns the Figma grid first on the default sort', () => {
    const page = queryCatalog(nfts, base)
    expect(page.items.map((item) => item.name).slice(0, 3)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #089',
      'Neon Vessel #552',
    ])
    expect(page.total).toBe(48)
    expect(page.totalPages).toBe(6)
  })

  it('combines search, category, network and price filters', () => {
    const page = queryCatalog(nfts, {
      ...base,
      q: 'golden',
      categories: ['music'],
      networks: ['solana'],
      maxPrice: '0.95',
    })
    expect(page.items.map((item) => item.name)).toEqual(['Golden Pulse #233'])
  })

  it('sorts by price both ways using decimal comparison', () => {
    const asc = queryCatalog(nfts, { ...base, sort: 'price-asc', pageSize: 48 }).items
    for (let i = 1; i < asc.length; i++)
      expect(compareEth(asc[i - 1]!.price, asc[i]!.price)).toBeLessThanOrEqual(0)
    const desc = queryCatalog(nfts, { ...base, sort: 'price-desc', pageSize: 48 }).items
    expect(desc[0]!.price).toBe(asc[asc.length - 1]!.price)
  })

  it('paginates without overlap', () => {
    const p1 = queryCatalog(nfts, base).items.map((item) => item.id)
    const p2 = queryCatalog(nfts, { ...base, page: 2 }).items.map((item) => item.id)
    expect(p1.filter((id) => p2.includes(id))).toEqual([])
  })

  it('returns an empty page with zeroed facets when nothing matches', () => {
    const page = queryCatalog(nfts, { ...base, q: 'nada-disso-existe' })
    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
    expect(page.facets.priceRange).toEqual({ min: '0', max: '0' })
  })

  it('computes facet counts before category filters', () => {
    const page = queryCatalog(nfts, { ...base, categories: ['music'] })
    const totalFromFacets = page.facets.categories.reduce((sum, facet) => sum + facet.count, 0)
    expect(totalFromFacets).toBe(48)
  })
})
