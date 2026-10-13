import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { cartKeys } from '@/features/cart'
import { isTerminal, OrderReceipt, useOrder } from '@/features/orders'
import { isAppError } from '@/shared/http'
import { Container } from '@/shared/ui/container'
import { Skeleton } from '@/shared/ui/skeleton'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/_authed/orders/$orderId')({
  head: () => ({
    meta: [
      { title: 'Pedido — Kurio' },
      { name: 'description', content: 'Acompanhe o status do seu pedido e veja o recibo.' },
    ],
  }),
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const order = useOrder(orderId)
  const queryClient = useQueryClient()
  const status = order.data?.status
  // Settlement removes the purchased quantities server-side: resync the cart.
  useEffect(() => {
    if (status && isTerminal(status)) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  }, [status, queryClient])
  return (
    <Container className="py-10">
      {order.data ? (
        <OrderReceipt order={order.data} />
      ) : order.isError ? (
        isAppError(order.error) && order.error.kind === 'not_found' ? (
          <StatusState
            title="Pedido não encontrado"
            description="Este pedido não existe ou pertence a outra conta."
            action={
              <Link
                to="/"
                className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink"
              >
                Ir para o início
              </Link>
            }
          />
        ) : (
          <StatusState
            tone="error"
            title="Não foi possível carregar o pedido"
            action={<RetryButton onRetry={() => void order.refetch()} pending={order.isFetching} />}
          />
        )
      ) : (
        <Skeleton className="mx-auto h-[600px] max-w-[578px] rounded-3xl" />
      )}
    </Container>
  )
}
