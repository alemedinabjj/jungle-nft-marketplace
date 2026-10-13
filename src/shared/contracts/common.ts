import { z } from 'zod'
import { isEthAmount } from '@/shared/money'

/** ETH amount as a decimal string — never a JS number. */
export const ethAmountSchema = z.string().refine(isEthAmount, { message: 'Valor em ETH inválido' })

export const quantitySchema = z.number().int().min(1)

export const isoDateSchema = z.iso.datetime()

export const idSchema = z.string().min(1)

export const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type Image = z.infer<typeof imageSchema>

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof networkSchema>

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}
