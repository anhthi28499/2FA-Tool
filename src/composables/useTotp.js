import { ref, watch, onUnmounted, unref } from 'vue'
import { generateSync, createGuardrails } from 'otplib'

const STEP_MS = 30_000

/** Cho phép secret Base32 ngắn (≥80 bit) như nhiều dịch vụ / ví dụ JBSWY3DPEHPK3PXP; mặc định otplib v13 yêu cầu ≥128 bit. */
const guardrails = createGuardrails({ MIN_SECRET_BYTES: 10 })

/**
 * Live TOTP code and progress (1 → 0 within each 30s window).
 * @param {import('vue').Ref<string | null | undefined> | (() => string | null | undefined)} secretSource
 */
export function useTotp(secretSource) {
  const code = ref('')
  const progress = ref(0)

  let intervalId = null

  function update() {
    const raw = typeof secretSource === 'function' ? secretSource() : unref(secretSource)
    if (!raw || typeof raw !== 'string') {
      code.value = ''
      progress.value = 0
      return
    }
    try {
      code.value = generateSync({
        secret: raw,
        strategy: 'totp',
        guardrails,
      })
      const now = Date.now()
      const msInPeriod = now % STEP_MS
      progress.value = (STEP_MS - msInPeriod) / STEP_MS
    } catch {
      code.value = ''
      progress.value = 0
    }
  }

  watch(
    () => (typeof secretSource === 'function' ? secretSource() : unref(secretSource)),
    update,
    { immediate: true }
  )

  intervalId = setInterval(update, 250)

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  return { code, progress }
}
