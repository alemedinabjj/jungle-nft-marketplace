import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  CatalogBrowser,
  catalogListOptions,
  catalogSearchSchema,
  featuredOptions,
  Hero,
  MobileSearchBar,
  toCatalogQuery,
  withFilters,
} from '@/features/catalog'
import { noop } from '@/shared/lib/noop'
import { Container } from '@/shared/ui/container'
import { BlogSection, PromoSection } from '@/shared/ui/home-sections'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => ({ query: toCatalogQuery(search) }),
  // Kick off the requests early without blocking navigation (skeletons show instead).
  loader: ({ context, deps }) => {
    context.queryClient.query(catalogListOptions(deps.query)).catch(noop)
    context.queryClient.query(featuredOptions()).catch(noop)
  },
  head: () => ({
    meta: [
      { title: 'Kurio — Marketplace de NFTs' },
      {
        name: 'description',
        content: 'Descubra NFTs selecionados, filtre por coleção, rede e preço e compre com sua carteira.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const onSearchChange = (next: typeof search) => void navigate({ search: next, resetScroll: false })
  return (
    <Container className="flex flex-col gap-4 pt-10 md:gap-16 md:pt-8 lg:gap-24">
      <MobileSearchBar
        key={search.q ?? ''}
        query={search.q}
        onSearch={(q) => onSearchChange(withFilters(search, { q }))}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <Hero />
      <div id="catalogo" className="scroll-mt-6">
        <CatalogBrowser
          search={search}
          onSearchChange={onSearchChange}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
        />
      </div>
      <PromoSection />
      <BlogSection />
    </Container>
  )
}
