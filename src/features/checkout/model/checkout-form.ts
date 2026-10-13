import { z } from 'zod'
import {
  collectorSchema,
  networkSchema,
  walletAddressSchema,
  type CreateOrderRequest,
  type User,
  type Wallet,
} from '@/shared/contracts'

export const checkoutFormSchema = z
  .object({
    collector: collectorSchema,
    walletId: z.string().min(1, 'Selecione uma carteira'),
    network: networkSchema,
    useAlternateAddress: z.boolean(),
    alternateAddress: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.useAlternateAddress) {
      const parsed = walletAddressSchema.safeParse(values.alternateAddress)
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['alternateAddress'],
          message: parsed.error.issues[0]?.message ?? 'Endereço inválido',
        })
      }
    }
  })

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

/** Prefill from the profile and the primary wallet; a saved draft wins. */
export function initialCheckoutValues(
  user: User,
  wallets: readonly Wallet[],
  draft: Partial<CheckoutFormValues> | null,
): CheckoutFormValues {
  const primary = wallets.find((wallet) => wallet.slot === 'primary') ?? wallets[0]
  const base: CheckoutFormValues = {
    collector: {
      displayName: user.displayName,
      username: user.username,
      profileName: user.displayName,
      email: user.email,
      referralCode: '',
      ensName: user.username.replace(/[^a-z0-9-]/g, '-').slice(0, 32),
      note: '',
    },
    walletId: primary?.id ?? '',
    network: primary?.network ?? 'ethereum',
    useAlternateAddress: false,
    alternateAddress: '',
  }
  if (!draft) return base
  const walletStillExists = draft.walletId && wallets.some((wallet) => wallet.id === draft.walletId)
  return {
    ...base,
    ...draft,
    collector: { ...base.collector, ...draft.collector },
    walletId: walletStillExists ? (draft.walletId ?? base.walletId) : base.walletId,
  }
}

export function toCreateOrderRequest(
  values: CheckoutFormValues,
  quoteFingerprint: string,
): CreateOrderRequest {
  return {
    quoteFingerprint,
    walletId: values.walletId,
    network: values.network,
    alternateAddress: values.useAlternateAddress ? values.alternateAddress.trim() : null,
    collector: values.collector,
  }
}
