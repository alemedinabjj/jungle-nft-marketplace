import { COUPON_FIXTURES } from '../fixtures/coupons'
import { buildNftFixtures } from '../fixtures/nfts'
import { USER_FIXTURES, WALLET_FIXTURES } from '../fixtures/users'
import { hashPassword } from '../lib/crypto'
import type { DbState } from './types'

export const DB_SCHEMA_VERSION = 1

export interface SeedOptions {
  /** Start with an empty catalog (scenario "empty-catalog"). */
  emptyCatalog?: boolean
}

export async function createSeedState(options: SeedOptions = {}): Promise<DbState> {
  const users = await Promise.all(
    USER_FIXTURES.map(async ({ password, ...user }) => {
      const passwordSalt = `salt-${user.id}`
      return { ...user, passwordSalt, passwordHash: await hashPassword(password, passwordSalt) }
    }),
  )

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: options.emptyCatalog ? [] : buildNftFixtures(),
    coupons: structuredClone(COUPON_FIXTURES),
    carts: [],
    favorites: { usr_ana: ['nft-002'], usr_bruno: [] },
    wallets: structuredClone(WALLET_FIXTURES),
    orders: [],
    idempotency: [],
    eventSeq: 0,
  }
}
