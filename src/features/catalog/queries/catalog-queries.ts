import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { CatalogQuery } from '@/shared/contracts'
import { catalogApi } from '../api/catalog-api'
import { catalogKeys } from './keys'

/**
 * `signal` is forwarded to Axios: when the query key changes (new search),
 * the previous request loses its observer and is aborted, and its late
 * response can never overwrite the current one (each key has its own entry).
 */
export const catalogListOptions = (query: CatalogQuery) =>
  queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) => catalogApi.list(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const featuredOptions = () =>
  queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => catalogApi.featured(signal),
    staleTime: 5 * 60_000,
  })

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => catalogApi.detail(id, signal),
    staleTime: 30_000,
  })

export const relatedOptions = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.related(id),
    queryFn: ({ signal }) => catalogApi.related(id, signal),
    staleTime: 60_000,
  })

export function useCatalog(query: CatalogQuery) {
  return useQuery(catalogListOptions(query))
}

export function useFeatured() {
  return useQuery(featuredOptions())
}

export function useNftDetail(id: string) {
  return useQuery(nftDetailOptions(id))
}

export function useRelated(id: string) {
  return useQuery(relatedOptions(id))
}
