import { useId, useState } from 'react'
import {
  CATEGORY_LABELS,
  NETWORK_LABELS,
  type CatalogPage,
  type Category,
  type Network,
} from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { ethToSteps, formatEth, stepsToEth } from '@/shared/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'
import { toggleValue, type CatalogSearch } from '../model/search-params'

interface FilterPanelProps {
  search: CatalogSearch
  facets: CatalogPage['facets'] | undefined
  onChange: (
    patch:
      | Partial<Omit<CatalogSearch, 'page'>>
      | ((previous: CatalogSearch) => Partial<Omit<CatalogSearch, 'page'>>),
  ) => void
  className?: string
}

function FacetList<T extends string>({
  title,
  facets,
  selected,
  labels,
  onToggle,
}: {
  title: string
  facets: { value: string; count: number }[] | undefined
  selected: readonly T[] | undefined
  labels: Record<T, string>
  onToggle: (value: T) => void
}) {
  const headingId = useId()
  return (
    <fieldset aria-labelledby={headingId} className="flex flex-col gap-1">
      <legend id={headingId} className="mb-3 text-body font-bold text-text-primary">
        {title}
      </legend>
      {facets
        ? facets.map(({ value, count }) => {
            const checked = selected?.includes(value as T) ?? false
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-body transition-colors hover:bg-surface-dark has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  checked ? 'font-bold text-text-accent' : 'text-text-secondary',
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={() => onToggle(value as T)}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2 rounded-full border border-primary',
                      checked ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                  {labels[value as T]}
                </span>
                <span className="tabular-nums">({count})</span>
              </label>
            )
          })
        : Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="my-1 h-5 w-full" />)}
    </fieldset>
  )
}

type Range = readonly [number, number]

function PriceRangeControl({
  bounds,
  initial,
  onApply,
}: {
  bounds: Range
  initial: Range
  onApply: (min?: string, max?: string) => void
}) {
  const [value, setValue] = useState<Range>(initial)
  const [low, high] = value
  return (
    <>
      <Slider
        aria-labelledby="price-range-label"
        min={bounds[0]}
        max={bounds[1]}
        step={1}
        minStepsBetweenThumbs={1}
        value={[low, high]}
        onValueChange={([nextLow = bounds[0], nextHigh = bounds[1]]) => setValue([nextLow, nextHigh])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="text-body text-text-secondary" aria-live="polite">
        Preço: {formatEth(stepsToEth(low), { symbol: false }).replace('.', ',')} -{' '}
        {formatEth(stepsToEth(high)).replace('.', ',')}
      </p>
      <Button
        size="sm"
        className="w-fit"
        onClick={() =>
          onApply(
            low > bounds[0] ? stepsToEth(low) : undefined,
            high < bounds[1] ? stepsToEth(high) : undefined,
          )
        }
      >
        Aplicar
      </Button>
    </>
  )
}

function PriceRange({
  search,
  range,
  onApply,
}: {
  search: CatalogSearch
  range: CatalogPage['facets']['priceRange'] | undefined
  onApply: (min?: string, max?: string) => void
}) {
  const bounds: Range | null =
    range && range.max !== '0' ? [ethToSteps(range.min), ethToSteps(range.max, 2, 'up')] : null
  const initial: Range | null = bounds
    ? [
        search.minPrice ? Math.max(bounds[0], ethToSteps(search.minPrice)) : bounds[0],
        search.maxPrice ? Math.min(bounds[1], ethToSteps(search.maxPrice, 2, 'up')) : bounds[1],
      ]
    : null
  return (
    <div className="flex flex-col gap-3">
      <p id="price-range-label" className="text-body font-bold text-text-primary">
        Faixa de preço
      </p>
      {bounds && initial ? (
        // Keyed so the local slider state resets when the URL or the available range changes.
        <PriceRangeControl
          key={`${bounds.join('-')}|${initial.join('-')}`}
          bounds={bounds}
          initial={initial}
          onApply={onApply}
        />
      ) : (
        <Skeleton className="h-16 w-full" />
      )}
    </div>
  )
}

/** Collections, price range and network filters (Figma sidebar, 310px). */
export function FilterPanel({ search, facets, onChange, className }: FilterPanelProps) {
  return (
    <div className={cn('flex flex-col gap-8 rounded-lg bg-surface-card px-5 py-6', className)}>
      <FacetList<Category>
        title="Coleções"
        facets={facets?.categories}
        selected={search.categories}
        labels={CATEGORY_LABELS}
        onToggle={(value) =>
          onChange((previous) => ({ categories: toggleValue(previous.categories, value) }))
        }
      />
      <PriceRange
        search={search}
        range={facets?.priceRange}
        onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
      />
      <FacetList<Network>
        title="Rede"
        facets={facets?.networks}
        selected={search.networks}
        labels={NETWORK_LABELS}
        onToggle={(value) => onChange((previous) => ({ networks: toggleValue(previous.networks, value) }))}
      />
    </div>
  )
}
