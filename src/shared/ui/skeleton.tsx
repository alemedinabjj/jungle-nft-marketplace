import type * as React from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * shadcn/ui Skeleton with a shimmer instead of pulse.
 * Callers pass the real content's dimensions so layout never shifts (CLS ≈ 0);
 * the global reduced-motion rule stops the animation when requested.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-card)_0%,var(--color-surface-dark)_50%,var(--color-surface-card)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
