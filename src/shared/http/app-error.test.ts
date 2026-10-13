import { describe, expect, it } from 'vitest'
import { AppError, kindFromStatus } from './app-error'

describe('kindFromStatus', () => {
  it.each([
    [400, 'validation'],
    [422, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [500, 'transient'],
    [503, 'transient'],
    [undefined, 'transient'],
  ] as const)('maps %s to %s', (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind)
  })
})

describe('AppError', () => {
  it('only transient errors are retryable', () => {
    expect(new AppError({ kind: 'transient', message: 'x' }).isRetryable).toBe(true)
    expect(new AppError({ kind: 'conflict', message: 'x' }).isRetryable).toBe(false)
  })
})
