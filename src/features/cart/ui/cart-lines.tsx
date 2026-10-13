import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { CartItem, QuoteIssue } from '@/shared/contracts'
import { isAppError } from '@/shared/http'
import { cn } from '@/shared/lib/cn'
import { formatEth, multiplyEth } from '@/shared/money'
import { useAnnounce } from '@/shared/ui/live-region'
import { NftImage } from '@/shared/ui/nft-image'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { Skeleton } from '@/shared/ui/skeleton'
import { lineKey, maxQuantity } from '../model/cart'
import { useRemoveCartItem, useUpdateCartItem } from '../queries/cart-queries'

const EDITION_LABEL: Record<CartItem['editionId'], string> = {
  '1-of-1': '1/1',
  '1-of-10': '1/10',
  '1-of-50': '1/50',
  open: 'Aberta',
}

function CartLine({ item, issue }: { item: CartItem; issue: QuoteIssue | undefined }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const announce = useAnnounce()
  const max = Math.max(1, maxQuantity(item))
  const busy = update.isPending || remove.isPending
  const error = update.error ?? remove.error

  return (
    <li
      className={cn('rounded-md bg-surface-card px-3 py-2 transition-opacity', busy && 'opacity-70')}
      aria-busy={busy}
    >
      <div className="grid grid-cols-[48px_1fr_auto] items-center gap-x-3 gap-y-3 md:grid-cols-[48px_minmax(0,1.6fr)_0.9fr_1fr_0.9fr_32px]">
        <NftImage image={item.image} sizes="48px" alt="" className="size-12 rounded-md" />
        <div className="min-w-0">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            className="block truncate text-body font-bold text-text-primary hover:text-text-accent"
          >
            {item.name}
          </Link>
          <p className="text-caption text-text-secondary">
            ID do token: {item.tokenId} · Edição {EDITION_LABEL[item.editionId]}
          </p>
        </div>
        <p className="hidden text-body font-bold text-text-accent md:block">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPrice)}
        </p>
        <div className="col-start-2 row-start-2 md:col-start-auto md:row-start-auto">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={max}
            label={`Quantidade de ${item.name}`}
            disabled={busy}
            onChange={(quantity) =>
              update.mutate(
                { nftId: item.nftId, editionId: item.editionId, quantity },
                { onSuccess: () => announce(`Quantidade de ${item.name} atualizada para ${quantity}.`) },
              )
            }
          />
        </div>
        {/* Single total element for every width (grid placement changes, not the node). */}
        <p className="col-start-3 row-start-2 text-right text-body font-bold text-text-accent md:col-start-auto md:row-start-auto md:text-left">
          <span className="sr-only">Total da linha: </span>
          {formatEth(multiplyEth(item.unitPrice, item.quantity))}
        </p>
        <button
          type="button"
          onClick={() =>
            // mutateAsync: the line unmounts on success, but the announcement must still happen
            void remove
              .mutateAsync({ nftId: item.nftId, editionId: item.editionId })
              .then(() => announce(`${item.name} removido do carrinho.`))
              .catch(() => undefined)
          }
          disabled={busy}
          aria-label={`Remover ${item.name} do carrinho`}
          className="col-start-3 row-start-1 flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-dark hover:text-text-primary md:col-start-auto md:row-start-auto"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
      {(issue || error) && (
        <div
          role="alert"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-danger/10 px-3 py-2 text-caption text-text-primary"
        >
          <span>
            {issue?.message ?? (isAppError(error) ? error.message : 'Não foi possível atualizar o item.')}
          </span>
          {issue?.kind === 'quantity-exceeds-stock' && item.available > 0 && (
            <button
              type="button"
              className="font-bold text-text-accent hover:underline"
              onClick={() =>
                update.mutate({
                  nftId: item.nftId,
                  editionId: item.editionId,
                  quantity: Math.min(item.available, item.maxPerOrder),
                })
              }
            >
              Ajustar para {Math.min(item.available, item.maxPerOrder)}
            </button>
          )}
          {issue?.kind === 'sold-out' && (
            <button
              type="button"
              className="font-bold text-text-accent hover:underline"
              onClick={() => remove.mutate({ nftId: item.nftId, editionId: item.editionId })}
            >
              Remover item
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function CartLines({ items, issues }: { items: CartItem[]; issues: QuoteIssue[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="hidden grid-cols-[48px_minmax(0,1.6fr)_0.9fr_1fr_0.9fr_32px] gap-x-3 border-b border-border pb-2 text-body font-bold text-text-primary md:grid"
        aria-hidden="true"
      >
        <span className="col-span-2">NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
      </div>
      <ul aria-label="Itens do carrinho" className="flex flex-col gap-2">
        {items.map((item) => (
          <CartLine
            key={lineKey(item)}
            item={item}
            issue={issues.find((issue) => issue.nftId === item.nftId && issue.editionId === item.editionId)}
          />
        ))}
      </ul>
    </div>
  )
}

export function CartLinesSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando carrinho">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 rounded-md bg-surface-card px-3 py-2">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}
