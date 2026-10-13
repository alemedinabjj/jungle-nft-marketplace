import { describe, expect, it } from 'vitest'
import type { RealtimeEvent } from '@/shared/contracts'
import { createEventLedger, reduceEvent } from './event-reducer'

const nftEvent = (eventId: string, version: number, resourceId = 'nft-001'): RealtimeEvent => ({
  eventId,
  type: 'nft.updated',
  resourceId,
  version,
  emittedAt: '2026-10-13T12:00:00.000Z',
  data: { price: '1.19', available: 3, editions: [] },
})

const orderEvent = (eventId: string, version: number, userId: string): RealtimeEvent => ({
  eventId,
  type: 'order.updated',
  resourceId: 'ord_1',
  version,
  userId,
  emittedAt: '2026-10-13T12:00:00.000Z',
  data: { status: 'confirmed', transactionId: '0xabc', rejectionReason: null },
})

describe('reduceEvent', () => {
  it('accepts a new event and records its version', () => {
    const result = reduceEvent(createEventLedger(), nftEvent('e1', 2), { userId: null })
    expect(result.accepted).toBe(true)
    expect(result.ledger.versions.get('nft.updated:nft-001')).toBe(2)
  })

  it('ignores duplicates by eventId without reapplying effects', () => {
    const first = reduceEvent(createEventLedger(), nftEvent('e1', 2), { userId: null })
    const dup = reduceEvent(first.ledger, nftEvent('e1', 2), { userId: null })
    expect(dup).toMatchObject({ accepted: false, reason: 'duplicate' })
    expect(dup.ledger).toBe(first.ledger)
  })

  it('ignores stale or equal versions (never regresses state)', () => {
    const first = reduceEvent(createEventLedger(), nftEvent('e1', 5), { userId: null })
    expect(reduceEvent(first.ledger, nftEvent('e2', 4), { userId: null })).toMatchObject({
      accepted: false,
      reason: 'stale',
    })
    expect(reduceEvent(first.ledger, nftEvent('e3', 5), { userId: null })).toMatchObject({
      accepted: false,
      reason: 'stale',
    })
    expect(reduceEvent(first.ledger, nftEvent('e4', 6), { userId: null }).accepted).toBe(true)
  })

  it('tracks versions per resource independently', () => {
    const first = reduceEvent(createEventLedger(), nftEvent('e1', 5, 'nft-001'), { userId: null })
    expect(reduceEvent(first.ledger, nftEvent('e2', 2, 'nft-002'), { userId: null }).accepted).toBe(true)
  })

  it('drops order events addressed to another user', () => {
    expect(
      reduceEvent(createEventLedger(), orderEvent('e1', 2, 'usr_bruno'), { userId: 'usr_ana' }),
    ).toMatchObject({
      accepted: false,
      reason: 'foreign-user',
    })
    expect(reduceEvent(createEventLedger(), orderEvent('e1', 2, 'usr_ana'), { userId: null })).toMatchObject({
      reason: 'foreign-user',
    })
    expect(
      reduceEvent(createEventLedger(), orderEvent('e1', 2, 'usr_ana'), { userId: 'usr_ana' }).accepted,
    ).toBe(true)
  })

  it('accepts a known baseline version from REST before events arrive', () => {
    const ledger = createEventLedger()
    ledger.versions.set('nft.updated:nft-001', 7)
    expect(reduceEvent(ledger, nftEvent('e1', 7), { userId: null }).accepted).toBe(false)
  })

  it('bounds the dedupe memory', () => {
    let ledger = createEventLedger(3)
    for (let i = 1; i <= 5; i++) ledger = reduceEvent(ledger, nftEvent(`e${i}`, i), { userId: null }).ledger
    expect(ledger.seen.size).toBe(3)
    expect(ledger.seen.has('e1')).toBe(false)
  })
})
