import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { compareEth, formatEth } from '@/shared/money'
import { useRealtime } from './realtime-context'

/** Tiny connection indicator (also exposed to tests via data-status). */
export function RealtimeStatusBadge({ className }: { className?: string }) {
  const { status } = useRealtime()
  const label =
    status === 'connected' ? 'Tempo real ativo' : status === 'reconnecting' ? 'Reconectando…' : 'Conectando…'
  return (
    <span
      data-testid="realtime-status"
      data-status={status}
      title={label}
      className={cn('inline-flex items-center gap-1.5 text-tiny text-text-secondary', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 rounded-full',
          status === 'connected' ? 'bg-success' : 'bg-text-accent motion-safe:animate-pulse',
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Banner on cart/checkout when a cart item's price or stock changed in realtime. */
export function CartChangeNotices() {
  const { notices, dismissNotice } = useRealtime()
  if (notices.length === 0) return null
  return (
    <ul aria-label="Mudanças nos itens do carrinho" className="flex flex-col gap-2">
      {notices.map((notice) => {
        const direction = compareEth(notice.price, notice.previousPrice)
        return (
          <li
            key={notice.id}
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-text-accent/60 bg-text-accent/10 px-4 py-3 text-body text-text-primary"
          >
            <p>
              {notice.available === 0 ? (
                <>
                  <strong>{notice.name}</strong> esgotou nesta edição. Ajuste o carrinho para continuar.
                </>
              ) : direction === 0 ? (
                <>
                  A disponibilidade de <strong>{notice.name}</strong> mudou: restam {notice.available}.
                </>
              ) : (
                <>
                  O preço de <strong>{notice.name}</strong> {direction > 0 ? 'subiu' : 'caiu'} de{' '}
                  {formatEth(notice.previousPrice)} para <strong>{formatEth(notice.price)}</strong>. O resumo
                  foi atualizado.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => dismissNotice(notice.id)}
              aria-label="Dispensar aviso"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-dark hover:text-text-primary"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
