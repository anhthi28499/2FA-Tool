import { describe, it, expect } from 'vitest'
import { normalizeBase32, parseUserInput } from './parseOtpauth.js'

describe('normalizeBase32', () => {
  it('returns empty for non-strings', () => {
    expect(normalizeBase32(null)).toBe('')
    expect(normalizeBase32(undefined)).toBe('')
  })

  it('strips whitespace, padding, uppercases', () => {
    expect(normalizeBase32('  jbsw y3dp  ')).toBe('JBSWY3DP')
    expect(normalizeBase32('ABCD====')).toBe('ABCD')
  })
})

describe('parseUserInput', () => {
  it('rejects empty input', () => {
    expect(parseUserInput('')).toEqual({
      secret: null,
      suggestedName: null,
      error: 'empty',
    })
    expect(parseUserInput('   ')).toEqual({
      secret: null,
      suggestedName: null,
      error: 'empty',
    })
  })

  it('parses valid base32 secret', () => {
    const r = parseUserInput('jbswy3dpehpk3pxp')
    expect(r.error).toBeNull()
    expect(r.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(r.suggestedName).toBeNull()
  })

  it('rejects invalid base32', () => {
    const r = parseUserInput('not-base32!!!')
    expect(r.secret).toBeNull()
    expect(r.error).toBe('invalid_base32')
  })

  it('parses otpauth URI with secret and label', () => {
    const uri =
      'otpauth://totp/Issuer:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Issuer'
    const r = parseUserInput(uri)
    expect(r.error).toBeNull()
    expect(r.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(r.suggestedName).toBe('Issuer:alice@example.com')
  })

  it('returns error when otpauth URI has no secret', () => {
    const r = parseUserInput('otpauth://totp/Label')
    expect(r.error).toBe('missing_secret')
    expect(r.secret).toBeNull()
  })
})
