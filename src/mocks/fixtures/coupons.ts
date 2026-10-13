import type { CouponRecord } from '../db/types'

/** KURIO10 is valid, LAUNCH24 is expired; anything else is invalid. */
export const COUPON_FIXTURES: CouponRecord[] = [
  { code: 'KURIO10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'LAUNCH24', percentOff: 15, expiresAt: '2024-12-31T23:59:59.000Z' },
]
