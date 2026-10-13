import type { Quote } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth, isZeroEth } from '@/shared/money'
import { Skeleton } from '@/shared/ui/skeleton'

/** Subtotal / discount / network fee / total — always the server's numbers. */
export function QuoteSummary({
  quote,
  className,
  updating,
}: {
  quote: Quote | undefined
  className?: string
  updating?: boolean
}) {
  if (!quote) return <QuoteSummarySkeleton className={className} />
  return (
    <dl
      aria-busy={updating}
      className={cn('flex flex-col gap-3 text-body transition-opacity aria-busy:opacity-60', className)}
    >
      <div className="flex justify-between">
        <dt className="text-text-primary">Subtotal</dt>
        <dd className="text-body-lg text-text-primary tabular-nums">{formatEth(quote.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-text-primary">Desconto do lançamento</dt>
        <dd className="text-text-primary tabular-nums">
          {isZeroEth(quote.discount) ? '(-) 0.00' : `(-) ${formatEth(quote.discount, { symbol: false })}`}
          {quote.coupon?.status === 'applied' && (
            <span className="ml-1 text-caption text-text-secondary">({quote.coupon.code})</span>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <dt className="text-text-primary">Taxa de rede</dt>
          <dd className="text-body-lg text-text-primary tabular-nums">{formatEth(quote.networkFee)}</dd>
        </div>
        <p className="text-right text-tiny text-text-accent">Taxa estimada</p>
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-4">
        <dt className="font-bold text-text-primary">Total</dt>
        <dd className="text-body-lg font-bold text-text-accent tabular-nums" aria-live="polite">
          {formatEth(quote.total)}
        </dd>
      </div>
    </dl>
  )
}

export function QuoteSummarySkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Calculando valores">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-border pt-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}
