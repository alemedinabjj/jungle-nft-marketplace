import type { RealtimeEvent } from '@/shared/contracts'

/**
 * Pure gate for incoming realtime events:
 * 1. drop events for another user (defence in depth — the server filters too);
 * 2. drop duplicates by `eventId` (at-least-once delivery, replays);
 * 3. drop versions ≤ the last applied one for that resource (out-of-order).
 * Only accepted events may touch the cache, so effects are never re-applied.
 */
export interface EventLedger {
  readonly seen: Set<string>
  readonly order: string[]
  readonly versions: Map<string, number>
  readonly capacity: number
}

export type EventDecision =
  | { accepted: true; ledger: EventLedger }
  | { accepted: false; reason: 'duplicate' | 'stale' | 'foreign-user'; ledger: EventLedger }

export function createEventLedger(capacity = 500): EventLedger {
  return { seen: new Set(), order: [], versions: new Map(), capacity }
}

export function resourceKey(event: Pick<RealtimeEvent, 'type' | 'resourceId'>): string {
  return `${event.type}:${event.resourceId}`
}

export function reduceEvent(
  ledger: EventLedger,
  event: RealtimeEvent,
  context: { userId: string | null },
): EventDecision {
  if (event.userId !== undefined && event.userId !== context.userId) {
    return { accepted: false, reason: 'foreign-user', ledger }
  }
  if (ledger.seen.has(event.eventId)) return { accepted: false, reason: 'duplicate', ledger }

  const key = resourceKey(event)
  const known = ledger.versions.get(key)
  if (known !== undefined && event.version <= known) return { accepted: false, reason: 'stale', ledger }

  const seen = new Set(ledger.seen)
  const order = [...ledger.order, event.eventId]
  seen.add(event.eventId)
  while (order.length > ledger.capacity) {
    const evicted = order.shift()
    if (evicted) seen.delete(evicted)
  }
  const versions = new Map(ledger.versions)
  versions.set(key, event.version)
  return { accepted: true, ledger: { seen, order, versions, capacity: ledger.capacity } }
}
