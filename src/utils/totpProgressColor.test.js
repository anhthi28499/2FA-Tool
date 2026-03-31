import { describe, it, expect } from 'vitest'
import { totpProgressColor } from './totpProgressColor.js'

describe('totpProgressColor', () => {
  it('clamps progress to 0–1', () => {
    expect(totpProgressColor(-1)).toBe(totpProgressColor(0))
    expect(totpProgressColor(2)).toBe(totpProgressColor(1))
  })

  it('returns red for low remaining (0–30%)', () => {
    expect(totpProgressColor(0)).toBe('#e74c3c')
    expect(totpProgressColor(0.15)).toBe('#e74c3c')
    expect(totpProgressColor(0.3)).toBe('#e74c3c')
  })

  it('returns blue for mid range (30–70%)', () => {
    expect(totpProgressColor(0.31)).toBe('#3498db')
    expect(totpProgressColor(0.5)).toBe('#3498db')
    expect(totpProgressColor(0.7)).toBe('#3498db')
  })

  it('returns green for high remaining (70–100%)', () => {
    expect(totpProgressColor(0.71)).toBe('#27ae60')
    expect(totpProgressColor(1)).toBe('#27ae60')
  })
})
