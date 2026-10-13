import { z } from 'zod'
import { idSchema, networkSchema } from './common'

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'])
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const walletSlotSchema = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof walletSlotSchema>

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais')

export const walletStatusSchema = z.enum(['disconnected', 'connected'])

export const walletSchema = z.object({
  id: idSchema,
  slot: walletSlotSchema,
  provider: walletProviderSchema,
  network: networkSchema,
  address: z.string(),
  label: z.string(),
  status: walletStatusSchema,
})
export type Wallet = z.infer<typeof walletSchema>

export const upsertWalletRequestSchema = z.object({
  provider: walletProviderSchema,
  network: networkSchema,
  address: walletAddressSchema,
  label: z.string().trim().max(32, 'Use no máximo 32 caracteres'),
})
export type UpsertWalletRequest = z.infer<typeof upsertWalletRequestSchema>
