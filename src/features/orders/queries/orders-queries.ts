import { queryOptions, useQuery } from '@tanstack/react-query'
import { useCurrentUserId } from '@/features/auth'
import { ordersApi } from '../api/orders-api'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.all, userId, 'detail', orderId] as const,
  pending: (userId: string) => [...orderKeys.all, userId, 'pending'] as const,
}

/**
 * Order state is pushed by `order.updated` over Socket.IO. While pending we
 * also poll slowly as a safety net (e.g. a dropped event during reconnection).
 */
export const orderQueryOptions = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, signal),
    staleTime: 5_000,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4_000 : false),
  })

export function useOrder(orderId: string) {
  const userId = useCurrentUserId()
  return useQuery({ ...orderQueryOptions(userId ?? 'anonymous', orderId), enabled: userId !== null })
}
