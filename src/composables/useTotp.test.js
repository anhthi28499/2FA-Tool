import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { generateSync, createGuardrails } from 'otplib'
import { useTotp } from './useTotp.js'

const guardrails = createGuardrails({ MIN_SECRET_BYTES: 10 })
const SAMPLE_SECRET = 'JBSWY3DPEHPK3PXP'

describe('useTotp', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('exposes empty code when secret is missing', async () => {
    const C = defineComponent({
      setup() {
        const secret = ref(null)
        return { secret, ...useTotp(secret) }
      },
      template: '<span>{{ code }}</span>',
    })
    const w = mount(C)
    await flushPromises()
    expect(w.text()).toBe('')
    w.unmount()
  })

  it('generates 6-digit TOTP for valid secret', async () => {
    const t0 = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(t0)
    const expected = generateSync({
      secret: SAMPLE_SECRET,
      strategy: 'totp',
      guardrails,
    })
    const C = defineComponent({
      setup() {
        const secret = ref(SAMPLE_SECRET)
        return { ...useTotp(secret) }
      },
      template: '<span>{{ code }}</span>',
    })
    const w = mount(C)
    await flushPromises()
    expect(w.vm.code).toBe(expected)
    expect(w.vm.code).toMatch(/^\d{6}$/)
    w.unmount()
  })

  it('sets progress between 0 and 1 inside a 30s window', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_007_500)
    const C = defineComponent({
      setup() {
        return { ...useTotp(ref(SAMPLE_SECRET)) }
      },
      template: '<span />',
    })
    const w = mount(C)
    await flushPromises()
    expect(w.vm.progress).toBeGreaterThan(0)
    expect(w.vm.progress).toBeLessThanOrEqual(1)
    w.unmount()
  })
})
