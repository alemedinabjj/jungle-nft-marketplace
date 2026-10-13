import { TERMINAL_ORDER_STATUSES, type Order, type OrderStatus } from '@/shared/contracts'

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status)
}

/**
 * Merge a newer order snapshot without ever regressing: a terminal state is
 * never replaced by "pending", and lower versions are ignored.
 */
export function mergeOrder(current: Order | undefined, incoming: Order): Order {
  if (!current) return incoming
  if (incoming.version < current.version) return current
  if (isTerminal(current.status) && !isTerminal(incoming.status)) return current
  return incoming
}
