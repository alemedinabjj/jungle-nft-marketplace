import type { QueryClient } from '@tanstack/react-query'
import type {
  Cart,
  CatalogPage,
  NftDetail,
  NftSummary,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from '@/shared/contracts'
import { cartKeys } from '@/features/cart'
import { catalogKeys } from '@/features/catalog'
import { isTerminal, orderKeys } from '@/features/orders'

export interface CartPriceNotice {
  id: string
  nftId: string
  name: string
  previousPrice: string
  price: string
  available: number
}

function patchSummary(item: NftSummary, event: NftUpdatedEvent): NftSummary {
  if (item.id !== event.resourceId || event.version <= item.version) return item
  return { ...item, price: event.data.price, available: event.data.available, version: event.version }
}

/**
 * nft.updated → patch every cached view of that NFT (detail, lists, related,
 * featured) without regressing versions, and resync the cart/quote if the NFT
 * is in it. Returns a notice when a cart item changed.
 */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): CartPriceNotice | null {
  queryClient.setQueryData<NftDetail>(catalogKeys.detail(event.resourceId), (detail) => {
    if (!detail || event.version <= detail.version) return detail
    return {
      ...detail,
      price: event.data.price,
      available: event.data.available,
      version: event.version,
      editions: detail.editions.map((edition) => ({
        ...edition,
        available:
          event.data.editions.find((candidate) => candidate.id === edition.id)?.available ??
          edition.available,
      })),
    }
  })
  queryClient.setQueriesData<CatalogPage>({ queryKey: catalogKeys.lists() }, (page) =>
    page ? { ...page, items: page.items.map((item) => patchSummary(item, event)) } : page,
  )
  queryClient.setQueriesData<NftSummary[]>({ queryKey: [...catalogKeys.all, 'related'] }, (items) =>
    items?.map((item) => patchSummary(item, event)),
  )

  let notice: CartPriceNotice | null = null
  // Only cart entries (cart keys also hold the owner's quote).
  const carts = queryClient.getQueriesData<Cart>({
    queryKey: cartKeys.all,
    predicate: (query) => query.queryKey[2] === 'detail',
  })
  for (const [, cart] of carts) {
    const line = cart?.items.find((item) => item.nftId === event.resourceId)
    if (!line) continue
    notice = {
      id: event.eventId,
      nftId: event.resourceId,
      name: line.name,
      previousPrice: line.unitPrice,
      price: event.data.price,
      available:
        event.data.editions.find((edition) => edition.id === line.editionId)?.available ??
        event.data.available,
    }
  }
  if (notice) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  return notice
}

/** order.updated → update the order in place (never regressing) and resync the cart on settlement. */
export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent): void {
  queryClient.setQueryData<Order>(orderKeys.detail(event.userId, event.resourceId), (order) => {
    if (!order || event.version <= order.version || isTerminal(order.status)) return order
    return { ...order, ...event.data, version: event.version }
  })
  void queryClient.invalidateQueries({ queryKey: orderKeys.detail(event.userId, event.resourceId) })
  if (isTerminal(event.data.status)) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}
