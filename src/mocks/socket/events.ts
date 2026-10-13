import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/contracts'
import { nextEventId } from '../db/store'
import type { DbState, NftRecord, OrderRecord } from '../db/types'
import { publish } from './bus'

/** Bump the NFT version and broadcast its new price/availability. Call inside mutateDb. */
export function emitNftUpdated(db: DbState, nft: NftRecord): NftUpdatedEvent {
  nft.available = nft.editions.reduce((sum, edition) => sum + edition.available, 0)
  nft.version += 1
  const event: NftUpdatedEvent = {
    eventId: nextEventId(db),
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    emittedAt: new Date().toISOString(),
    data: {
      price: nft.price,
      available: nft.available,
      editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
    },
  }
  publish(event)
  return event
}

export function emitOrderUpdated(db: DbState, order: OrderRecord): OrderUpdatedEvent {
  const event: OrderUpdatedEvent = {
    eventId: nextEventId(db),
    type: 'order.updated',
    resourceId: order.id,
    version: order.version,
    userId: order.userId,
    emittedAt: new Date().toISOString(),
    data: {
      status: order.status,
      transactionId: order.transactionId,
      rejectionReason: order.rejectionReason,
    },
  }
  publish(event)
  return event
}
