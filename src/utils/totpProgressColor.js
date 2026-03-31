/**
 * Màu thanh thời gian còn lại trong chu kỳ TOTP (progress: 0…1).
 * 0–30%: đỏ, 30–70%: xanh dương, 70–100%: xanh lá.
 */
export function totpProgressColor(progress) {
  const p = Math.max(0, Math.min(1, progress)) * 100
  if (p <= 30) return '#e74c3c'
  if (p <= 70) return '#3498db'
  return '#27ae60'
}
