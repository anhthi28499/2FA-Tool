/**
 * Normalize TOTP secret: strip whitespace, padding, uppercase for Base32.
 */
export function normalizeBase32(secret) {
  if (!secret || typeof secret !== 'string') return ''
  return secret.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase()
}

function isValidBase32(secret) {
  return /^[A-Z2-7]+$/i.test(secret) && secret.length > 0
}

function parseOtpAuthUri(uri) {
  const rest = uri.replace(/^otpauth:\/\//i, '')
  const qIdx = rest.indexOf('?')
  const pathPart = qIdx >= 0 ? rest.slice(0, qIdx) : rest
  const query = qIdx >= 0 ? rest.slice(qIdx + 1) : ''
  const params = new URLSearchParams(query)
  const secretParam = params.get('secret')
  if (!secretParam) {
    return { secret: null, suggestedName: null, error: 'missing_secret' }
  }
  const secret = normalizeBase32(secretParam)
  if (!isValidBase32(secret)) {
    return { secret: null, suggestedName: null, error: 'invalid_secret' }
  }

  const segments = pathPart.split('/').filter(Boolean)
  let suggestedName = null
  if (segments.length >= 2) {
    const label = segments.slice(1).join('/')
    try {
      suggestedName = decodeURIComponent(label).replace(/\+/g, ' ')
    } catch {
      suggestedName = label
    }
  }
  const issuer = params.get('issuer')
  if (!suggestedName && issuer) suggestedName = issuer

  return { secret, suggestedName, error: null }
}

/**
 * Parse raw user input: Base32 secret or otpauth:// URL.
 * @returns {{ secret: string | null, suggestedName: string | null, error: string | null }}
 */
export function parseUserInput(input) {
  const trimmed = input.trim()
  if (!trimmed) {
    return { secret: null, suggestedName: null, error: 'empty' }
  }

  if (/^otpauth:\/\//i.test(trimmed)) {
    try {
      return parseOtpAuthUri(trimmed)
    } catch {
      return { secret: null, suggestedName: null, error: 'invalid_uri' }
    }
  }

  const secret = normalizeBase32(trimmed)
  if (!secret) {
    return { secret: null, suggestedName: null, error: 'empty' }
  }
  if (!isValidBase32(secret)) {
    return { secret: null, suggestedName: null, error: 'invalid_base32' }
  }
  return { secret, suggestedName: null, error: null }
}
