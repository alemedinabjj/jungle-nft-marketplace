import type { CreateOrderRequest } from '@/shared/contracts'
import type { PurchaseAttempt } from './idempotency'

/**
 * Per-user checkout persistence in sessionStorage (tab-scoped, cleared on
 * logout): the form draft survives a session expiry, and the in-flight attempt
 * survives a refresh so the same order can be recovered instead of re-created.
 */
export interface InFlightPurchase {
  attempt: PurchaseAttempt
  payload: CreateOrderRequest
}

const draftKey = (userId: string) => `kurio:checkout-draft:${userId}`
const attemptKey = (userId: string) => `kurio:checkout-attempt:${userId}`

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

function read(key: string): unknown {
  const raw = storage()?.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export const checkoutStorage = {
  /** Untrusted shape: callers merge it over validated defaults. */
  readDraft: (userId: string) => read(draftKey(userId)) as Record<string, unknown> | null,
  writeDraft: (userId: string, draft: unknown) => storage()?.setItem(draftKey(userId), JSON.stringify(draft)),
  clearDraft: (userId: string) => storage()?.removeItem(draftKey(userId)),
  readInFlight: (userId: string) => read(attemptKey(userId)) as InFlightPurchase | null,
  writeInFlight: (userId: string, value: InFlightPurchase) =>
    storage()?.setItem(attemptKey(userId), JSON.stringify(value)),
  clearInFlight: (userId: string) => storage()?.removeItem(attemptKey(userId)),
}
