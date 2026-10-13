import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps text color when a custom font-size token is merged', () => {
    expect(cn('text-primary-foreground', 'text-body')).toBe('text-primary-foreground text-body')
    expect(cn('text-body', 'text-caption')).toBe('text-caption')
    expect(cn('text-ink', 'text-text-accent')).toBe('text-text-accent')
  })
})
