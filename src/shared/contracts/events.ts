import { z } from 'zod'
import { ethAmountSchema, idSchema, isoDateSchema } from './common'
import { editionIdSchema } from './nft'
import { orderStatusSchema } from './order'

/** Every realtime message shares this envelope (dedupe by eventId, ordering by version). */
const envelope = {
  eventId: idSchema,
  resourceId: idSchema,
  version: z.number().int().min(1),
  emittedAt: isoDateSchema,
  userId: idSchema.optional(),
}

export const nftUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('nft.updated'),
  data: z.object({
    price: ethAmountSchema,
    available: z.number().int().min(0),
    editions: z.array(z.object({ id: editionIdSchema, available: z.number().int().min(0) })),
  }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('order.updated'),
  userId: idSchema,
  data: z.object({
    status: orderStatusSchema,
    transactionId: z.string().nullable(),
    rejectionReason: z.string().nullable(),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
])
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export const REALTIME_EVENT_CHANNEL = 'event'
