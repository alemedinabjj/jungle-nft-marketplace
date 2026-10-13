/**
 * One Idempotency-Key per purchase *attempt*. An attempt is identified by the
 * exact payload: retries after a timeout, double clicks or a refresh resend the
 * same key (the server returns the same order); any change creates a new key.
 */
export interface PurchaseAttempt {
  key: string
  hash: string
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonical(nested)]),
    )
  }
  return value
}

export function payloadHash(payload: unknown): string {
  return JSON.stringify(canonical(payload))
}

export function newIdempotencyKey(): string {
  return `chk_${crypto.randomUUID()}`
}

export function attemptFor(
  previous: PurchaseAttempt | null,
  payload: unknown,
  generate: () => string = newIdempotencyKey,
): PurchaseAttempt {
  const hash = payloadHash(payload)
  return previous && previous.hash === hash ? previous : { key: generate(), hash }
}
