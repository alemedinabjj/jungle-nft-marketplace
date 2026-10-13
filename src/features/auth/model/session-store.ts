/**
 * Session token persistence. Only the opaque token and its expiry are stored —
 * never credentials. Pure storage module: no React, no HTTP.
 */
export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

const KEY = 'kurio:session'

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readStoredSession(): StoredSession | null {
  const raw = storage()?.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null
    }
    return { token: parsed.token, userId: parsed.userId, expiresAt: parsed.expiresAt }
  } catch {
    return null
  }
}

export function writeStoredSession(session: StoredSession): void {
  storage()?.setItem(KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  storage()?.removeItem(KEY)
}

export function isSessionExpired(session: Pick<StoredSession, 'expiresAt'>, now = Date.now()): boolean {
  return Date.parse(session.expiresAt) <= now
}

/** Only same-origin, path-only redirects are honoured after login (no open redirects). */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return fallback
  return target
}
