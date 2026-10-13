import {
  CATEGORY_LABELS,
  categorySchema,
  networkSchema,
  type CatalogPage,
  type CatalogQuery,
  type Category,
  type NftSummary,
  type Network,
} from '@/shared/contracts'
import { compareEth, parseEth, toEthString } from '@/shared/money'
import type { NftRecord } from '../../db/types'

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    price: nft.price,
    compareAtPrice: nft.compareAtPrice,
    image: nft.image,
    category: nft.category,
    network: nft.network,
    collectionName: nft.collectionName,
    available: nft.available,
    isNew: nft.isNew,
    version: nft.version,
  }
}

function matchesText(nft: NftRecord, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [nft.name, nft.collectionName, nft.tokenId, CATEGORY_LABELS[nft.category]].some((field) =>
    field.toLowerCase().includes(needle),
  )
}

function inPriceRange(nft: NftRecord, min?: string, max?: string): boolean {
  if (min !== undefined && compareEth(nft.price, min) < 0) return false
  if (max !== undefined && compareEth(nft.price, max) > 0) return false
  return true
}

const sorters: Record<CatalogQuery['sort'], (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
  'price-asc': (a, b) => compareEth(a.price, b.price) || a.id.localeCompare(b.id),
  'price-desc': (a, b) => compareEth(b.price, a.price) || a.id.localeCompare(b.id),
  popular: (a, b) => b.popularity - a.popularity || a.id.localeCompare(b.id),
}

function countBy<T extends string>(items: NftRecord[], values: readonly T[], pick: (nft: NftRecord) => T) {
  return values.map((value) => ({ value, count: items.filter((nft) => pick(nft) === value).length }))
}

/**
 * Pure catalog query: search → tab → facets (computed before category/network
 * filters so counts stay useful) → filters → sort → paginate.
 */
export function queryCatalog(nfts: NftRecord[], query: CatalogQuery): CatalogPage {
  let pool = nfts.filter((nft) => matchesText(nft, query.q ?? ''))
  if (query.tab === 'new') pool = pool.filter((nft) => nft.isNew)
  if (query.tab === 'trending') pool = pool.filter((nft) => nft.popularity >= 50)

  const facets: CatalogPage['facets'] = {
    categories: countBy<Category>(pool, categorySchema.options, (nft) => nft.category),
    networks: countBy<Network>(pool, networkSchema.options, (nft) => nft.network),
    priceRange: pool.length
      ? {
          min: toEthString(
            pool.reduce(
              (min, nft) => (parseEth(nft.price).lessThan(min) ? parseEth(nft.price) : min),
              parseEth(pool[0]!.price),
            ),
          ),
          max: toEthString(
            pool.reduce(
              (max, nft) => (parseEth(nft.price).greaterThan(max) ? parseEth(nft.price) : max),
              parseEth(pool[0]!.price),
            ),
          ),
        }
      : { min: '0', max: '0' },
  }

  const categories = query.categories ?? []
  const networks = query.networks ?? []
  const filtered = pool
    .filter((nft) => categories.length === 0 || categories.includes(nft.category))
    .filter((nft) => networks.length === 0 || networks.includes(nft.network))
    .filter((nft) => inPriceRange(nft, query.minPrice, query.maxPrice))
    .sort(sorters[query.sort])

  const total = filtered.length
  const totalPages = Math.ceil(total / query.pageSize)
  const start = (query.page - 1) * query.pageSize

  return {
    items: filtered.slice(start, start + query.pageSize).map(toSummary),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    facets,
  }
}
