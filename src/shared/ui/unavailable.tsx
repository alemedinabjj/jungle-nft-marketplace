import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Out-of-scope link/action (editorial pages, support, activity…). Rendered as a
 * disabled control that says so — it never navigates or pretends to succeed.
 */
export function Unavailable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-disabled="true"
      title="Indisponível nesta demonstração"
      className={cn('cursor-not-allowed opacity-70', className)}
    >
      {children}
      <span className="sr-only"> (indisponível nesta demonstração)</span>
    </span>
  )
}
