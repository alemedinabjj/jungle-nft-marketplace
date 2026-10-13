import { z } from 'zod'
import { editionIdSchema } from './nft'
import { ethAmountSchema, idSchema, imageSchema, isoDateSchema, networkSchema } from './common'
import { walletAddressSchema, walletProviderSchema } from './wallet'
import { usernameSchema } from './profile'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['confirmed', 'rejected']

export const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(40),
  username: usernameSchema,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(40),
  email: z.email('Informe um e-mail válido'),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,16}$/i, 'Código de indicação inválido'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,32}$/, 'Use letras minúsculas, números ou hífen (3 a 32)'),
  note: z.string().max(500, 'Use no máximo 500 caracteres'),
})
export type Collector = z.infer<typeof collectorSchema>

export const createOrderRequestSchema = z.object({
  quoteFingerprint: z.string().min(1),
  walletId: idSchema,
  network: networkSchema,
  /** Optional different wallet address supplied at checkout ("Usar outra carteira?"). */
  alternateAddress: walletAddressSchema.nullable(),
  collector: collectorSchema,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key'

export const orderLineSchema = z.object({
  nftId: idSchema,
  editionId: editionIdSchema,
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  quantity: z.number().int().min(1),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
})
export type OrderLine = z.infer<typeof orderLineSchema>

/** Receipt snapshot: every value is frozen at creation time. */
export const orderSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
  lines: z.array(orderLineSchema).min(1),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  couponCode: z.string().nullable(),
  network: networkSchema,
  wallet: z.object({ provider: walletProviderSchema, address: z.string() }),
  collector: collectorSchema.pick({ displayName: true, username: true, email: true }),
  transactionId: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: z.number().int().min(1),
})
export type Order = z.infer<typeof orderSchema>
