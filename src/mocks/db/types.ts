import type { Cart, Collector, NftDetail, Order, User, Wallet } from '@/shared/contracts'

export interface UserRecord extends User {
  passwordHash: string
  passwordSalt: string
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface NftRecord extends NftDetail {
  popularity: number
}

export interface CouponRecord {
  code: string
  percentOff: number
  expiresAt: string
}

export interface IdempotencyRecord {
  key: string
  userId: string
  requestHash: string
  orderId: string
}

export interface OrderRecord extends Order {
  userId: string
  collectorFull: Collector
  /** Cart lines that must be removed once the order is confirmed. */
  purchased: { nftId: string; editionId: Cart['items'][number]['editionId']; quantity: number }[]
}

export interface CartRecord {
  id: string
  ownerKey: string
  items: { nftId: string; editionId: Cart['items'][number]['editionId']; quantity: number }[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export interface DbState {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  coupons: CouponRecord[]
  carts: CartRecord[]
  favorites: Record<string, string[]>
  wallets: Record<string, Wallet[]>
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
  eventSeq: number
}
