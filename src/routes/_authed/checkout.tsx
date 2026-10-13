import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '@/features/auth'
import { useCart } from '@/features/cart'
import { CheckoutFlow, checkoutStorage } from '@/features/checkout'
import { CartChangeNotices } from '@/features/realtime'
import { useWallets } from '@/features/wallets'
import { isAppError } from '@/shared/http'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { Container } from '@/shared/ui/container'
import { Skeleton } from '@/shared/ui/skeleton'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/_authed/checkout')({
  head: () => ({
    meta: [
      { title: 'Pagamento — Kurio' },
      { name: 'description', content: 'Confirme seus dados, carteira e rede para concluir a compra.' },
    ],
  }),
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = Route.useNavigate()
  const session = useSession()
  const cart = useCart()
  const wallets = useWallets()
  const user = session.data?.user
  const hasInFlight = user ? checkoutStorage.readInFlight(user.id) !== null : false

  return (
    <Container className="flex flex-col gap-6 pt-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/cart' }, { label: 'Pagamento' }]}
      />
      <h1 className="sr-only">Pagamento</h1>
      <CartChangeNotices />
      {!user || cart.isPending || wallets.isPending ? (
        <div
          className="grid gap-10 lg:grid-cols-[553px_293px] lg:justify-between"
          aria-busy="true"
          aria-label="Carregando pagamento"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : cart.isError || wallets.isError ? (
        <StatusState
          tone="error"
          title="Não foi possível carregar o pagamento"
          description={
            isAppError(cart.error ?? wallets.error) ? (cart.error ?? wallets.error)?.message : undefined
          }
          action={<RetryButton onRetry={() => void Promise.all([cart.refetch(), wallets.refetch()])} />}
        />
      ) : cart.data.items.length === 0 && !hasInFlight ? (
        <StatusState
          title="Seu carrinho está vazio"
          description="Adicione NFTs ao carrinho para finalizar uma compra."
          action={
            <Link
              to="/"
              hash="catalogo"
              className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink"
            >
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <CheckoutFlow
          user={user}
          wallets={wallets.data}
          onPlaced={(order) => void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })}
        />
      )}
    </Container>
  )
}
