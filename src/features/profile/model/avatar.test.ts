import { describe, expect, it } from 'vitest'
import { checkAvatarFile } from './avatar'

describe('checkAvatarFile', () => {
  it('accepts supported images within the size limit', () => {
    expect(checkAvatarFile({ type: 'image/png', size: 200_000 })).toEqual({ ok: true })
  })
  it('rejects other types and huge files', () => {
    expect(checkAvatarFile({ type: 'image/gif', size: 10 }).ok).toBe(false)
    expect(checkAvatarFile({ type: 'image/jpeg', size: 9_000_000 }).ok).toBe(false)
  })
})
