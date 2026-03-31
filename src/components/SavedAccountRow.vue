<script setup>
import { computed } from 'vue'
import { useTotp } from '../composables/useTotp'
import { maskSecret } from '../utils/maskSecret'

const props = defineProps({
  id: { type: String, required: true },
  name: { type: String, default: '' },
  secret: { type: String, required: true },
})

defineEmits(['remove', 'copy'])

const secretRef = computed(() => props.secret)
const { code, progress } = useTotp(secretRef)

const masked = computed(() => maskSecret(props.secret))
</script>

<template>
  <tr>
    <td class="actions">
      <button type="button" class="btn btn-small btn-danger" @click="$emit('remove', id)">
        Xóa
      </button>
      <button
        type="button"
        class="btn btn-small btn-secondary"
        :disabled="!code"
        @click="$emit('copy', code)"
      >
        Copy
      </button>
    </td>
    <td>{{ name || '—' }}</td>
    <td class="mono muted">{{ masked }}</td>
    <td class="code-cell">
      <span class="mono code-digits">{{ code || '—' }}</span>
      <div class="progress-wrap" aria-hidden="true">
        <div class="progress-bar" :style="{ width: `${progress * 100}%` }" />
      </div>
    </td>
  </tr>
</template>

<style scoped>
.actions {
  white-space: nowrap;
}
.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}
.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  margin-right: 0.35rem;
}
.btn-danger {
  background: #c0392b;
  color: #fff;
}
.btn-danger:hover {
  background: #a93226;
}
.btn-secondary {
  background: #7f8c8d;
  color: #fff;
}
.btn-secondary:hover:not(:disabled) {
  background: #636e72;
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.muted {
  color: #555;
  font-size: 0.9rem;
}
.code-cell {
  min-width: 8rem;
}
.code-digits {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}
.progress-wrap {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 0.35rem;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #e74c3c;
  transition: width 0.2s linear;
}
</style>
