import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

interface MobileSearchBarProps {
  query: string | undefined
  onSearch: (q: string | undefined) => void
  onOpenFilters: () => void
}

/** Figma mobile "Search Bar": search field + filter button (45px). */
export function MobileSearchBar({ query, onSearch, onOpenFilters }: MobileSearchBarProps) {
  const [value, setValue] = useState(query ?? '')
  return (
    <div className="flex gap-2 md:hidden">
      <form
        role="search"
        className="flex h-[45px] flex-1 items-center gap-2 rounded-lg bg-surface-card px-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch(value.trim() || undefined)
        }}
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-text-secondary" />
        <label htmlFor="mobile-search" className="sr-only">
          Buscar NFTs
        </label>
        <input
          id="mobile-search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Explorar coleções"
          className="h-full min-w-0 flex-1 bg-transparent text-body text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
      </form>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label="Abrir filtros"
        className="flex size-[45px] items-center justify-center rounded-lg bg-primary text-ink"
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
