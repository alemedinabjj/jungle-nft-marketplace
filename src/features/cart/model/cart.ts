import type { CartItem, EditionId } from '@/shared/contracts'

/** Pure cart rules shared by the UI (stepper limits, counters, keys). */

export function lineKey(item: { nftId: string; editionId: EditionId }): string {
  return `${item.nftId}:${item.editionId}`
}

/** Highest quantity the collector may select for this line right now. */
export function maxQuantity(item: Pick<CartItem, 'available' | 'maxPerOrder'>): number {
  return Math.max(0, Math.min(item.available, item.maxPerOrder))
}

export function clampQuantity(requested: number, item: Pick<CartItem, 'available' | 'maxPerOrder'>): number {
  if (!Number.isFinite(requested)) return 1
  return Math.min(Math.max(1, Math.trunc(requested)), Math.max(1, maxQuantity(item)))
}

export function itemCount(items: readonly Pick<CartItem, 'quantity'>[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export type LineProblem = 'sold-out' | 'exceeds-stock' | null

export function lineProblem(item: Pick<CartItem, 'quantity' | 'available'>): LineProblem {
  if (item.available === 0) return 'sold-out'
  if (item.quantity > item.available) return 'exceeds-stock'
  return null
}
