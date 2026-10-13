import { z } from 'zod'
import { editionIdSchema } from './nft'
import { ethAmountSchema, idSchema, imageSchema, isoDateSchema } from './common'

export const cartItemSchema = z.object({
  nftId: idSchema,
  editionId: editionIdSchema,
  quantity: z.number().int().min(1),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  unitPrice: ethAmountSchema,
  /** Units still available for this edition right now. */
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: idSchema,
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  version: z.number().int().min(1),
  updatedAt: isoDateSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemRequestSchema = z.object({
  nftId: idSchema,
  editionId: editionIdSchema,
  quantity: z.number().int().min(1),
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({ quantity: z.number().int().min(1) })
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe um código').max(32).toUpperCase(),
})
export type ApplyCouponRequest = z.infer<typeof applyCouponRequestSchema>

/** Header carrying the anonymous cart owner id for guests. */
export const GUEST_ID_HEADER = 'X-Guest-Id'
