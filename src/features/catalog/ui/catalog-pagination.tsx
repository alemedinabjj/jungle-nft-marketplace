import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { withPage, type CatalogSearch } from '../model/search-params'

function pagesToShow(current: number, total: number): (number | 'gap')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1]
    return previous !== undefined && page - previous > 1 ? ['gap' as const, page] : [page]
  })
}

/** Crawlable pagination: every page is a real <a href> carrying the full URL state. */
export function CatalogPagination({
  search,
  page,
  totalPages,
}: {
  search: CatalogSearch
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const itemClass = 'flex size-6 items-center justify-center rounded text-caption font-bold transition-colors'
  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex items-center gap-3">
        {page > 1 && (
          <li>
            <Link
              to="/"
              search={withPage(search, page - 1)}
              aria-label="Página anterior"
              className={cn(itemClass, 'hover:bg-surface-dark')}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Link>
          </li>
        )}
        {pagesToShow(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="text-text-secondary">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={withPage(search, item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  itemClass,
                  item === page ? 'bg-primary text-ink' : 'text-text-primary hover:bg-surface-dark',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link
              to="/"
              search={withPage(search, page + 1)}
              aria-label="Próxima página"
              className={cn(itemClass, 'hover:bg-surface-dark')}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
