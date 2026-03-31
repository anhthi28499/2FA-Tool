import { describe, it, expect } from 'vitest'
import { maskSecret } from './maskSecret.js'

describe('maskSecret', () => {
  it('returns bullets for short or empty secrets', () => {
    expect(maskSecret('')).toBe('••••')
    expect(maskSecret('ab')).toBe('••••')
    expect(maskSecret('abcd')).toBe('••••')
  })

  it('strips whitespace before masking', () => {
    expect(maskSecret('  abcd efgh  ')).toBe('****…efgh')
  })

  it('shows last four characters for longer secrets', () => {
    expect(maskSecret('JBSWY3DPEHPK3PXP')).toBe('****…3PXP')
  })
})
