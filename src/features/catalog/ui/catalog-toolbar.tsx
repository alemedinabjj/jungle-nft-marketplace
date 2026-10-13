import type { CatalogSort, CatalogTab } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { SORT_LABELS } from '../model/sort-labels'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

interface CatalogToolbarProps {
  tab: CatalogTab
  sort: CatalogSort
  onTabChange: (tab: CatalogTab) => void
  onSortChange: (sort: CatalogSort) => void
}

export function CatalogToolbar({ tab, sort, onTabChange, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div role="group" aria-label="Filtrar lista" className="flex gap-5 overflow-x-auto">
        {TABS.map((item) => {
          const active = item.value === tab
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              onClick={() => onTabChange(item.value)}
              className={cn(
                'relative pb-2 text-body whitespace-nowrap transition-colors',
                active
                  ? 'font-bold text-text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-text-primary hover:text-text-accent',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="hidden items-center gap-2 text-body md:flex">
        <span id="sort-label" className="text-text-primary">
          Ordenar por:
        </span>
        <Select value={sort} onValueChange={(value) => onSortChange(value as CatalogSort)}>
          <SelectTrigger
            aria-labelledby="sort-label"
            className="h-8 w-auto gap-1 border-none bg-transparent px-1 text-text-secondary"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
