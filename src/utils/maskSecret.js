/** Mask secret for table display (e.g. ****…bm7n). */
export function maskSecret(secret) {
  const n = typeof secret === 'string' ? secret.replace(/\s+/g, '') : ''
  if (n.length <= 4) return '••••'
  return `****…${n.slice(-4)}`
}
