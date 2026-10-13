import { readStoredSession } from './session-store'

/** Token provider for the HTTP client (read fresh on every request). */
export function currentToken(): string | null {
  return readStoredSession()?.token ?? null
}
