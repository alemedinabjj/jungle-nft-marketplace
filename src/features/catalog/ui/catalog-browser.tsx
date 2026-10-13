import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import type { CatalogSort } from '@/shared/contracts'
import { isAppError } from '@/shared/http'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { RetryButton, StatusState } from '@/shared/ui/status-state'
import { hasActiveFilters, toCatalogQuery, withFilters, type CatalogSearch } from '../model/search-params'
import { useCatalog } from '../queries/catalog-queries'
import { CatalogPagination } from './catalog-pagination'
import { SORT_LABELS } from '../model/sort-labels'
import { CatalogToolbar } from './catalog-toolbar'
import { FeaturedBanner } from './featured-banner'
import { FilterPanel } from './filter-panel'
import { NftCard, NftCardSkeleton } from './nft-card'

interface CatalogBrowserProps {
  search: CatalogSearch
  onSearchChange: (next: CatalogSearch) => void
  /** Mobile filters drawer, opened from the page's search bar (Figma mobile). */
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}

/** Catalog with URL-driven filters, sort, tabs and pagination. */
export function CatalogBrowser({
  search,
  onSearchChange,
  filtersOpen,
  onFiltersOpenChange,
}: CatalogBrowserProps) {
  const query = useMemo(() => toCatalogQuery(search), [search])
  const catalog = useCatalog(query)
  const update = (patch: Partial<Omit<CatalogSearch, 'page'>>) => onSearchChange(withFilters(search, patch))
  const clearAll = () => onSearchChange(withFilters({ tab: search.tab, sort: search.sort }, {}))

  const data = catalog.data
  const isUpdating = catalog.isFetching && catalog.isPlaceholderData
  const errorMessage = isAppError(catalog.error)
    ? catalog.error.message
    : 'Não foi possível carregar o catálogo.'

  const filters = <FilterPanel search={search} facets={data?.facets} onChange={update} />

  return (
    <section aria-labelledby="catalog-title" className="grid gap-8 lg:grid-cols-[310px_1fr] lg:gap-12">
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <aside aria-label="Filtros" className="hidden flex-col gap-6 lg:flex">
        {filters}
        <FeaturedBanner />
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        <CatalogToolbar
          tab={query.tab}
          sort={query.sort}
          onTabChange={(tab) => update({ tab })}
          onSortChange={(sort) => update({ sort })}
        />

        <div className="hidden flex-wrap items-center gap-3 md:flex lg:hidden">
          <Button variant="outline" size="sm" onClick={() => onFiltersOpenChange(true)}>
            <SlidersHorizontal aria-hidden="true" />
            Filtros
          </Button>
        </div>
        <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange}>
          <SheetContent side="left" className="px-4 pt-14 pb-6">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="sr-only">
              Refine o catálogo por coleção, preço e rede.
            </SheetDescription>
            <label className="flex flex-col gap-2 text-body font-bold text-text-primary md:hidden">
              Ordenar por
              <select
                value={query.sort}
                onChange={(event) => update({ sort: event.target.value as CatalogSort })}
                className="h-10 rounded-md border border-border bg-ink px-3 font-normal text-text-primary"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {filters}
          </SheetContent>
        </Sheet>

        {hasActiveFilters(search) && (
          <div className="flex flex-wrap items-center gap-3 text-body text-text-secondary">
            {search.q && (
              <span>
                Resultados para <strong className="text-text-primary">“{search.q}”</strong>
              </span>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 font-bold text-text-accent hover:underline"
            >
              <X aria-hidden="true" className="size-4" />
              Limpar filtros
            </button>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {catalog.isPending ? 'Carregando catálogo' : data ? `${data.total} NFTs encontrados` : ''}
        </p>

        {catalog.isError && data && (
          <StatusState
            tone="error"
            title="Não foi possível atualizar o catálogo"
            description={errorMessage}
            action={<RetryButton onRetry={() => void catalog.refetch()} pending={catalog.isFetching} />}
            className="py-6"
          />
        )}

        {catalog.isPending ? (
          <ul
            className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]"
            aria-busy="true"
            aria-label="Carregando NFTs"
          >
            {Array.from({ length: 9 }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        ) : catalog.isError && !data ? (
          <StatusState
            tone="error"
            title="Não foi possível carregar o catálogo"
            description={errorMessage}
            action={<RetryButton onRetry={() => void catalog.refetch()} pending={catalog.isFetching} />}
          />
        ) : data && data.items.length === 0 ? (
          <StatusState
            title="Nenhum NFT encontrado"
            description={
              hasActiveFilters(search)
                ? 'Tente remover algum filtro ou buscar por outro termo.'
                : 'Ainda não há NFTs listados no mercado.'
            }
            action={
              hasActiveFilters(search) ? (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : data ? (
          <>
            <ul
              aria-label="NFTs"
              aria-busy={isUpdating}
              className="grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity aria-busy:opacity-60 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]"
            >
              {data.items.map((nft, index) => (
                <li key={nft.id}>
                  <NftCard nft={nft} priority={index < 3} />
                </li>
              ))}
            </ul>
            <CatalogPagination search={search} page={data.page} totalPages={data.totalPages} />
          </>
        ) : null}
      </div>
    </section>
  )
}
