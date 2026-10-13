import { describe, expect, it } from 'vitest'
import type { User, Wallet } from '@/shared/contracts'
import { checkoutFormSchema, initialCheckoutValues, toCreateOrderRequest } from './checkout-form'

const user: User = {
  id: 'usr_ana',
  displayName: 'Ana Ribeiro',
  username: 'ana.ribeiro',
  email: 'ana@kurio.dev',
  bio: '',
  avatarUrl: null,
}
const wallets: Wallet[] = [
  {
    id: 'w1',
    slot: 'primary',
    provider: 'metamask',
    network: 'polygon',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    label: 'P',
    status: 'disconnected',
  },
]

describe('checkout form', () => {
  it('prefills from profile and primary wallet', () => {
    const values = initialCheckoutValues(user, wallets, null)
    expect(values).toMatchObject({
      walletId: 'w1',
      network: 'polygon',
      collector: { displayName: 'Ana Ribeiro', ensName: 'ana-ribeiro' },
    })
  })

  it('restores a draft but drops a wallet that no longer exists', () => {
    const values = initialCheckoutValues(user, wallets, {
      walletId: 'gone',
      collector: { referralCode: 'KURIO-01' } as never,
    })
    expect(values.walletId).toBe('w1')
    expect(values.collector.referralCode).toBe('KURIO-01')
    expect(values.collector.email).toBe('ana@kurio.dev')
  })

  it('requires a valid alternate address only when enabled', () => {
    const values = {
      ...initialCheckoutValues(user, wallets, null),
      collector: { ...initialCheckoutValues(user, wallets, null).collector, referralCode: 'KURIO-01' },
    }
    expect(checkoutFormSchema.safeParse(values).success).toBe(true)
    const invalid = checkoutFormSchema.safeParse({
      ...values,
      useAlternateAddress: true,
      alternateAddress: '0x123',
    })
    expect(invalid.success).toBe(false)
    expect(invalid.error?.issues[0]?.path).toEqual(['alternateAddress'])
  })

  it('builds the order request with the reviewed quote fingerprint', () => {
    const values = initialCheckoutValues(user, wallets, null)
    expect(toCreateOrderRequest(values, 'fp')).toMatchObject({
      quoteFingerprint: 'fp',
      walletId: 'w1',
      alternateAddress: null,
    })
  })
})
