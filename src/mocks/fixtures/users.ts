import type { Wallet } from '@/shared/contracts'

/**
 * Fictitious accounts documented in the README. Passwords are hashed at seed
 * time; only the hash + salt are persisted by the simulated backend.
 */
export const DEMO_PASSWORD = 'Kurio2026'

export const USER_FIXTURES = [
  {
    id: 'usr_ana',
    displayName: 'Ana Ribeiro',
    username: 'ana.ribeiro',
    email: 'ana@kurio.dev',
    bio: 'Coleciono arte generativa e retratos ilustrados.',
    avatarUrl: null,
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr_bruno',
    displayName: 'Bruno Costa',
    username: 'bruno.costa',
    email: 'bruno@kurio.dev',
    bio: 'Fã de música on-chain.',
    avatarUrl: null,
    password: DEMO_PASSWORD,
  },
] as const

export const WALLET_FIXTURES: Record<string, Wallet[]> = {
  usr_ana: [
    {
      id: 'wal_ana_primary',
      slot: 'primary',
      provider: 'metamask',
      network: 'ethereum',
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      label: 'Carteira principal',
      status: 'disconnected',
    },
  ],
  usr_bruno: [],
}
