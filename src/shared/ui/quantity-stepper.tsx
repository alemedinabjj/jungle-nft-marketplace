import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

/** − n + stepper (Figma circular amber buttons). Integer only, clamped to [min, max]. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  disabled,
  size = 'md',
}: QuantityStepperProps) {
  const button = cn(
    'flex items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-text-accent disabled:cursor-not-allowed disabled:opacity-40',
    size === 'md' ? 'size-8' : 'size-6 rounded-md',
  )
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Diminuir ${label.toLowerCase()}`}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-body-lg text-text-primary tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Aumentar ${label.toLowerCase()}`}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
