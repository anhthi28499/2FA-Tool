import { describe, it, expect } from 'vitest'
import {
  encodeSecretForShare,
  decodeSecretFromShare,
  readTokenFromPathname,
} from './shareLink.js'

describe('shareLink', () => {
  it('roundtrips Base32 secret', () => {
    const raw = 'JBSWY3DPEHPK3PXP'
    const t = encodeSecretForShare(raw)
    expect(t).toBeTruthy()
    expect(decodeSecretFromShare(t)).toBe(raw)
  })

  it('roundtrips otpauth URL', () => {
    const raw =
      'otpauth://totp/Issuer:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Issuer'
    const t = encodeSecretForShare(raw)
    expect(decodeSecretFromShare(t)).toBe(raw)
  })

  it('trims when encoding', () => {
    const raw = '  ABC  '
    const t = encodeSecretForShare(raw)
    expect(decodeSecretFromShare(t)).toBe('ABC')
  })

  it('readTokenFromPathname extracts token', () => {
    expect(readTokenFromPathname('/s/abc-def_ghi')).toBe('abc-def_ghi')
    expect(readTokenFromPathname('/')).toBeNull()
    expect(readTokenFromPathname('/s/')).toBeNull()
  })
})
