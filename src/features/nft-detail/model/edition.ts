import type { Edition, EditionId } from '@/shared/contracts'

const PREFERRED: readonly EditionId[] = ['1-of-50', '1-of-10', 'open', '1-of-1']

/** Default to the 1/50 edition (as in Figma), else the next one that still has stock. */
export function defaultEdition(editions: readonly Edition[]): EditionId {
  for (const id of PREFERRED) {
    if (editions.some((edition) => edition.id === id && edition.available > 0)) return id
  }
  return editions[0]?.id ?? 'open'
}

/** Units the collector can still add, given what is already in the cart. */
export function remainingForEdition(
  edition: Pick<Edition, 'available' | 'maxPerOrder'>,
  inCart: number,
): number {
  return Math.max(0, Math.min(edition.available, edition.maxPerOrder) - inCart)
}
