import { z } from 'zod'
import {
  catalogPageSchema,
  featuredSchema,
  nftDetailSchema,
  nftSummarySchema,
  type CatalogPage,
  type CatalogQuery,
  type Featured,
  type NftDetail,
  type NftSummary,
} from '@/shared/contracts'
import { http } from '@/shared/http'

/** Serialize the normalized query exactly as the API expects it. */
export function toSearchParams(query: CatalogQuery): Record<string, string> {
  const params: Record<string, string> = {
    tab: query.tab,
    sort: query.sort,
    page: String(query.page),
    pageSize: String(query.pageSize),
  }
  if (query.q) params.q = query.q
  if (query.categories?.length) params.categories = query.categories.join(',')
  if (query.networks?.length) params.networks = query.networks.join(',')
  if (query.minPrice) params.minPrice = query.minPrice
  if (query.maxPrice) params.maxPrice = query.maxPrice
  return params
}

export const catalogApi = {
  async list(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
    const { data } = await http.get<unknown>('/nfts', { params: toSearchParams(query), signal })
    return catalogPageSchema.parse(data)
  },
  async featured(signal?: AbortSignal): Promise<Featured> {
    const { data } = await http.get<unknown>('/nfts/featured', { signal })
    return featuredSchema.parse(data)
  },
  async detail(id: string, signal?: AbortSignal): Promise<NftDetail> {
    const { data } = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal })
    return nftDetailSchema.parse(data)
  },
  async related(id: string, signal?: AbortSignal): Promise<NftSummary[]> {
    const { data } = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}/related`, { signal })
    return z.array(nftSummarySchema).parse(data)
  },
}
