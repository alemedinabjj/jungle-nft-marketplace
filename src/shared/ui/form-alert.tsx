import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Form-level message (API errors without a field, success notes). Announced to screen readers. */
export function FormAlert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'info' | 'success'
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl border px-4 py-3 text-body leading-5',
        tone === 'error' && 'border-danger/50 bg-danger/10 text-text-primary',
        tone === 'info' && 'border-border-soft bg-surface-card text-text-secondary',
        tone === 'success' && 'border-success/50 bg-success/10 text-text-primary',
        className,
      )}
    >
      {children}
    </div>
  )
}
