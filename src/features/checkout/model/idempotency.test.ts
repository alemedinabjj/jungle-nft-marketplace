import { describe, expect, it } from 'vitest'
import { attemptFor, payloadHash } from './idempotency'

describe('idempotency attempts', () => {
  const payload = { quoteFingerprint: 'fp', walletId: 'w', network: 'ethereum' }

  it('reuses the key for the same payload (retries, double clicks, timeouts)', () => {
    const first = attemptFor(null, payload, () => 'key-1')
    const again = attemptFor(first, { ...payload }, () => 'key-2')
    expect(again).toBe(first)
    expect(again.key).toBe('key-1')
  })

  it('creates a new key when the payload changes (new attempt)', () => {
    const first = attemptFor(null, payload, () => 'key-1')
    const changed = attemptFor(first, { ...payload, quoteFingerprint: 'fp-2' }, () => 'key-2')
    expect(changed.key).toBe('key-2')
  })

  it('hashes payloads independently of key order', () => {
    expect(payloadHash({ a: 1, b: { c: 2, d: 3 } })).toBe(payloadHash({ b: { d: 3, c: 2 }, a: 1 }))
    expect(payloadHash({ a: 1 })).not.toBe(payloadHash({ a: 2 }))
  })
})
