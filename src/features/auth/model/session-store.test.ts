import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  safeRedirect,
  writeStoredSession,
} from './session-store'

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
})

describe('session store', () => {
  it('round-trips and clears the stored session', () => {
    writeStoredSession({ token: 't', userId: 'u', expiresAt: '2099-01-01T00:00:00.000Z' })
    expect(readStoredSession()?.token).toBe('t')
    clearStoredSession()
    expect(readStoredSession()).toBeNull()
  })

  it('ignores corrupted data', () => {
    localStorage.setItem('kurio:session', '{not json')
    expect(readStoredSession()).toBeNull()
    localStorage.setItem('kurio:session', JSON.stringify({ token: 1 }))
    expect(readStoredSession()).toBeNull()
  })

  it('detects expiry', () => {
    expect(
      isSessionExpired({ expiresAt: '2026-01-01T00:00:00.000Z' }, Date.parse('2026-01-01T00:00:00.001Z')),
    ).toBe(true)
    expect(
      isSessionExpired({ expiresAt: '2026-01-01T00:00:01.000Z' }, Date.parse('2026-01-01T00:00:00.000Z')),
    ).toBe(false)
  })

  it('only allows same-origin relative redirects', () => {
    expect(safeRedirect('/checkout?step=review')).toBe('/checkout?step=review')
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect(undefined, '/perfil')).toBe('/perfil')
  })
})
