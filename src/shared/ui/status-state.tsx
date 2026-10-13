import { RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from './button'

interface StatusStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  tone?: 'empty' | 'error'
  className?: string
}

/** Empty / error states that are not drawn in Figma, in the same visual language. */
export function StatusState({ title, description, action, tone = 'empty', className }: StatusStateProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-soft bg-surface-card/60 px-6 py-14 text-center',
        className,
      )}
    >
      <p className="text-body-lg font-bold text-text-primary">{title}</p>
      {description && <p className="max-w-md text-body leading-6 text-text-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function RetryButton({ onRetry, pending }: { onRetry: () => void; pending?: boolean }) {
  return (
    <Button variant="outline" size="sm" onClick={onRetry} disabled={pending} aria-busy={pending}>
      <RotateCw aria-hidden="true" className={cn(pending && 'motion-safe:animate-spin')} />
      {pending ? 'Tentando…' : 'Tentar novamente'}
    </Button>
  )
}
