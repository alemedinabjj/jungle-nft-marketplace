import { describe, expect, it } from 'vitest'
import { shortAddress } from './address'

describe('shortAddress', () => {
  it('abbreviates long addresses and keeps short ones', () => {
    expect(shortAddress('0x8ba1f109551bD432803012645Ac136ddd64DBA72')).toBe('0x8ba1…BA72')
    expect(shortAddress('0x1234')).toBe('0x1234')
  })
})
