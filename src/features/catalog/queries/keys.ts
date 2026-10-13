import type { CatalogQuery } from '@/shared/contracts'

/** Public (non user-scoped) catalog keys. The list key IS the API query. */
export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (query: CatalogQuery) => [...catalogKeys.lists(), query] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (id: string) => [...catalogKeys.details(), id] as const,
  related: (id: string) => [...catalogKeys.all, 'related', id] as const,
}
