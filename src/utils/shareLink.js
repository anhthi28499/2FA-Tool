/**
 * Chuỗi nhập (Base32 hoặc otpauth URL) → token Base64URL cho đường dẫn /s/<token>.
 * Cảnh báo: URL có thể lộ trong log server / referrer — chỉ chia sẻ khi chấp nhận rủi ro.
 */

export function encodeSecretForShare(raw) {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return ''
  const bytes = new TextEncoder().encode(s)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeSecretFromShare(token) {
  if (!token || typeof token !== 'string') return null
  const t = token.trim()
  if (!t) return null
  try {
    const b64 = t.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const binary = atob(b64 + pad)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/** Trích token từ pathname dạng /s/<token> (app đặt tại root). */
export function readTokenFromPathname(pathname) {
  const path = typeof pathname === 'string' ? pathname.replace(/\/+$/, '') : ''
  const m = path.match(/^\/s\/(.+)$/)
  return m ? m[1] : null
}
