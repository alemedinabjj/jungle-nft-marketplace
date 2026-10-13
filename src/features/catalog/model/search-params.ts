import { z } from 'zod'
import {
  CATALOG_PAGE_SIZE,
  catalogSortSchema,
  catalogTabSchema,
  categorySchema,
  networkSchema,
  type CatalogQuery,
} from '@/shared/contracts'
import { compareEth, isEthAmount } from '@/shared/money'

/**
 * URL state of the catalog. Every field is optional in the URL and invalid
 * values fall back to defaults (`.catch`) instead of crashing the route, so
 * hand-edited or stale links always render something sensible.
 */
const csv = <T extends string>(item: z.ZodEnum<{ [K in T]: K }>) =>
  z
    .union([z.array(z.string()), z.string()])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .transform((values) =>
      values.flatMap((value) => {
        const parsed = item.safeParse(value)
        return parsed.success ? [parsed.data] : []
      }),
    )
    .optional()
    .catch(undefined)

const ethParam = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(isEthAmount)
  .optional()
  .catch(undefined)

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  categories: csv(categorySchema),
  networks: csv(networkSchema),
  minPrice: ethParam,
  maxPrice: ethParam,
  tab: catalogTabSchema.optional().catch(undefined),
  sort: catalogSortSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

const unique = <T>(values: readonly T[] | undefined) =>
  values?.length ? [...new Set(values)].sort() : undefined

/**
 * Normalized API query derived from the URL. Used verbatim as the query key,
 * so equivalent URLs (reordered filters, empty strings) hit the same cache entry.
 */
export function toCatalogQuery(search: CatalogSearch): CatalogQuery {
  let { minPrice, maxPrice } = search
  if (minPrice && maxPrice && compareEth(minPrice, maxPrice) > 0) [minPrice, maxPrice] = [maxPrice, minPrice]
  const q = search.q?.trim()
  const categories = unique(search.categories)
  const networks = unique(search.networks)
  return {
    ...(q && { q }),
    ...(categories && { categories }),
    ...(networks && { networks }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

/**
 * Apply a filter change to the URL state. Any change other than the page
 * itself sends the user back to page 1; defaults are dropped to keep URLs short.
 */
export function withFilters(
  previous: CatalogSearch,
  patch: Partial<Omit<CatalogSearch, 'page'>>,
): CatalogSearch {
  const next: CatalogSearch = { ...previous, ...patch, page: undefined }
  if (!next.q) next.q = undefined
  if (!next.categories?.length) next.categories = undefined
  if (!next.networks?.length) next.networks = undefined
  if (next.tab === 'all') next.tab = undefined
  if (next.sort === 'recent') next.sort = undefined
  return next
}

export function withPage(previous: CatalogSearch, page: number): CatalogSearch {
  return { ...previous, page: page > 1 ? page : undefined }
}

export function toggleValue<T>(values: readonly T[] | undefined, value: T): T[] {
  const set = new Set(values ?? [])
  if (set.has(value)) set.delete(value)
  else set.add(value)
  return [...set]
}

export function hasActiveFilters(search: CatalogSearch): boolean {
  return Boolean(
    search.q || search.categories?.length || search.networks?.length || search.minPrice || search.maxPrice,
  )
}
