import { createFileRoute, Link } from '@tanstack/react-router'
import { CartLines, CartLinesSkeleton, CouponForm, useCart, useQuote } from '@/features/cart'
import { NftCard, useRelated } from '@/features/catalog'
import { RelatedNfts } from '@/features/nft-detail'
import { canConfirm, QuoteSummary } from '@/features/quote'
import { isAppError } from '@/shared/http'
import { cn } from '@/shared/lib/cn'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { Container } from '@/shared/ui/container'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [
      { title: 'Carrinho — Kurio' },
      { name: 'description', content: 'Revise seus NFTs, aplique cupons e finalize a compra.' },
    ],
  }),
  component: CartPage,
})

function CartPage() {
  const cart = useCart()
  const items = cart.data?.items ?? []
  const quote = useQuote(items.length > 0)
  const related = useRelated(items[0]?.nftId ?? 'nft-002')
  const ready = quote.data !== undefined && !quote.isFetching && canConfirm(quote.data)

  return (
    <Container className="flex flex-col gap-6 pt-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Carrinho' }]}
      />
      <h1 className="sr-only">Carrinho</h1>

      {cart.isPending ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-16">
          <CartLinesSkeleton />
          <QuoteSummary quote={undefined} />
        </div>
      ) : cart.isError ? (
        <StatusState
          tone="error"
          title="Não foi possível carregar seu carrinho"
          description={isAppError(cart.error) ? cart.error.message : undefined}
          action={<RetryButton onRetry={() => void cart.refetch()} pending={cart.isFetching} />}
        />
      ) : items.length === 0 ? (
        <StatusState
          title="Seu carrinho está vazio"
          description="Explore o mercado e adicione NFTs para continuar."
          action={
            <Link
              to="/"
              hash="catalogo"
              className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
            >
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-16">
          <CartLines items={items} issues={quote.data?.issues ?? []} />
          <aside
            aria-labelledby="summary-title"
            className="flex flex-col gap-5 self-start rounded-lg lg:sticky lg:top-6"
          >
            <h2
              id="summary-title"
              className="border-b border-border pb-3 text-body-lg font-bold text-text-primary"
            >
              Resumo da carteira
            </h2>
            <CouponForm />
            {quote.isError && !quote.data ? (
              <StatusState
                tone="error"
                title="Não foi possível calcular os valores"
                action={<RetryButton onRetry={() => void quote.refetch()} pending={quote.isFetching} />}
                className="py-6"
              />
            ) : (
              <QuoteSummary quote={quote.data} updating={quote.isFetching} />
            )}
            {quote.data && quote.data.issues.length > 0 && (
              <p role="alert" className="text-caption text-danger">
                Ajuste os itens indicados para finalizar a compra.
              </p>
            )}
            <Link
              to="/checkout"
              disabled={!ready}
              aria-disabled={!ready}
              className={cn(
                'flex h-10 items-center justify-center rounded-md bg-primary text-body font-bold text-ink transition-colors hover:bg-text-accent',
                !ready && 'pointer-events-none opacity-50',
              )}
            >
              Conectar e finalizar
            </Link>
            <Link to="/" hash="catalogo" className="text-center text-body text-text-accent hover:underline">
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}

      <div className="mt-16">
        <RelatedNfts
          title="Colecionadores também viram"
          items={related.data}
          renderItem={(nft) => <NftCard nft={nft} />}
        />
      </div>
    </Container>
  )
}
