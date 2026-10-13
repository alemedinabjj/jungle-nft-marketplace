import { Link } from '@tanstack/react-router'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS, type Order } from '@/shared/contracts'
import { formatEth } from '@/shared/money'
import { NftImage } from '@/shared/ui/nft-image'
import { Unavailable } from '@/shared/ui/unavailable'

// Created lazily: building an Intl formatter is costly and must not run at import time.
let dateParts: Intl.DateTimeFormat | undefined
const getDateParts = () =>
  (dateParts ??= new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }))

/** "13 out, 2026" (Figma: "29 Jul, 2026"). */
function formatDate(iso: string): string {
  const parts = getDateParts().formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('day')} ${get('month').replace('.', '')}, ${get('year')}`
}

function shortHash(hash: string): string {
  return `0x${hash.slice(2, 6).toUpperCase()}…${hash.slice(-4).toUpperCase()}`
}

/** Receipt is rendered only from the order snapshot — never from the live catalog. */
function ReceiptDetails({ order }: { order: Order }) {
  return (
    <section aria-labelledby="receipt-details" className="flex flex-col gap-4">
      <h2 id="receipt-details" className="text-body-lg font-bold text-text-primary">
        Detalhes da transação
      </h2>
      <table className="w-full text-body">
        <caption className="sr-only">Itens comprados</caption>
        <thead>
          <tr className="border-b border-border text-left text-text-primary">
            <th scope="col" className="pb-2 font-bold">
              NFTs
            </th>
            <th scope="col" className="pb-2 text-right font-bold">
              Edições
            </th>
            <th scope="col" className="pb-2 text-right font-bold">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={`${line.nftId}:${line.editionId}`} className="border-b border-border/60">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <NftImage image={line.image} sizes="48px" alt="" className="size-12 rounded-md" />
                  <div>
                    <p className="font-bold text-text-primary">{line.name}</p>
                    <p className="text-caption text-text-secondary">ID do token: {line.tokenId}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-right text-text-secondary">(x {line.quantity})</td>
              <td className="py-3 text-right font-bold text-text-accent">{formatEth(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="flex flex-col gap-2 text-body">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatEth(order.subtotal)}</dd>
        </div>
        {order.couponCode && (
          <div className="flex justify-between">
            <dt>Desconto ({order.couponCode})</dt>
            <dd className="tabular-nums">(-) {formatEth(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd className="tabular-nums">{formatEth(order.networkFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-bold">
          <dt>Total</dt>
          <dd className="text-text-accent tabular-nums">{formatEth(order.total)}</dd>
        </div>
      </dl>
    </section>
  )
}

/** Figma "Order Confirmation Modal" (578px), shown as a page so it survives refresh. */
export function OrderReceipt({ order }: { order: Order }) {
  if (order.status === 'pending') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-[578px] flex-col items-center gap-4 rounded-3xl border border-border bg-surface-card px-8 py-14 text-center"
      >
        <Loader2 aria-hidden="true" className="size-14 text-text-accent motion-safe:animate-spin" />
        <h1 className="text-heading font-bold text-text-primary">Processando seu pagamento…</h1>
        <p className="text-body leading-6 text-text-secondary">
          Aguardando a confirmação da rede {NETWORK_LABELS[order.network]}. Você pode fechar esta página: o
          pedido continua sendo processado e aparece aqui ao voltar.
        </p>
        <p className="text-caption text-text-secondary">Pedido {order.id}</p>
      </div>
    )
  }

  if (order.status === 'rejected') {
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-[578px] flex-col items-center gap-4 rounded-3xl border border-danger/50 bg-surface-card px-8 py-14 text-center"
      >
        <XCircle aria-hidden="true" className="size-14 text-danger" />
        <h1 className="text-heading font-bold text-text-primary">Pagamento recusado</h1>
        <p className="text-body leading-6 text-text-secondary">
          {order.rejectionReason ?? 'O pagamento não foi concluído.'}
        </p>
        <p className="text-body text-text-secondary">
          Seu carrinho foi mantido. Você pode revisar e tentar novamente.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/cart"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
          >
            Voltar ao carrinho
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article
      aria-labelledby="receipt-title"
      className="mx-auto flex max-w-[578px] flex-col gap-8 rounded-3xl border border-border bg-surface-card px-5 py-8 md:px-11 md:py-10"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 aria-hidden="true" className="size-20 text-success" />
        <h1 id="receipt-title" className="text-body-lg font-bold text-text-primary" tabIndex={-1}>
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-surface-dark p-4 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <dt className="text-caption whitespace-nowrap text-text-secondary">ID da transação</dt>
          <dd className="font-bold text-text-primary" title={order.transactionId ?? undefined}>
            {order.transactionId ? shortHash(order.transactionId) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Data</dt>
          <dd className="font-bold text-text-primary">{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Total</dt>
          <dd className="font-bold text-text-accent">{formatEth(order.total)}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Carteira</dt>
          <dd className="font-bold text-text-primary">{WALLET_PROVIDER_LABELS[order.wallet.provider]}</dd>
        </div>
      </dl>
      <ReceiptDetails order={order} />
      <p className="text-center text-caption leading-5 text-text-secondary">
        Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para a carteira
        conectada.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link
          to="/"
          hash="catalogo"
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
        >
          Continuar explorando
        </Link>
        <Unavailable className="text-caption text-text-accent">Ver no Etherscan</Unavailable>
      </div>
    </article>
  )
}
