import { z } from 'zod'
import { editionIdSchema } from './nft'
import { ethAmountSchema, idSchema, isoDateSchema } from './common'

export const quoteIssueSchema = z.object({
  nftId: idSchema,
  editionId: editionIdSchema,
  kind: z.enum(['quantity-exceeds-stock', 'sold-out', 'unavailable']),
  message: z.string(),
})
export type QuoteIssue = z.infer<typeof quoteIssueSchema>

export const couponStatusSchema = z.enum(['applied', 'invalid', 'expired'])

export const quoteLineSchema = z.object({
  nftId: idSchema,
  editionId: editionIdSchema,
  quantity: z.number().int().min(0),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
})
export type QuoteLine = z.infer<typeof quoteLineSchema>

export const quoteSchema = z.object({
  lines: z.array(quoteLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: z
    .object({ code: z.string(), status: couponStatusSchema, percentOff: z.number(), message: z.string() })
    .nullable(),
  issues: z.array(quoteIssueSchema),
  /**
   * Hash of everything the price depends on (lines, unit prices, coupon, fee).
   * The order endpoint rejects a fingerprint that no longer matches (409 QUOTE_CHANGED).
   */
  fingerprint: z.string(),
  computedAt: isoDateSchema,
})
export type Quote = z.infer<typeof quoteSchema>
