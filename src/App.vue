<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { parseUserInput } from './utils/parseOtpauth'
import {
  encodeSecretForShare,
  decodeSecretFromShare,
  readTokenFromPathname,
} from './utils/shareLink'
import { useTotp } from './composables/useTotp'
import { useSavedSecrets } from './composables/useSavedSecrets'
import { totpProgressColor } from './utils/totpProgressColor'
import SavedAccountRow from './components/SavedAccountRow.vue'

/** Thay số và tên thật khi cần hiển thị liên hệ trong footer */
const CONTACT_PHONE_PLACEHOLDER = '0xx xxx xxxx'
const CONTACT_NAME_PLACEHOLDER = 'Họ và tên'
const CONTACT_LINE = `SĐT: ${CONTACT_PHONE_PLACEHOLDER} — ${CONTACT_NAME_PLACEHOLDER}`

const secretInput = ref('')
const nameInput = ref('')
const formError = ref('')
const activeSecret = ref(null)

const { entries, add, remove } = useSavedSecrets()
const { code, progress } = useTotp(activeSecret)

const progressBarColor = computed(() => totpProgressColor(progress.value))

/** Toast mới nhất ở đầu mảng (trên cùng). */
const copyToasts = ref([])
let nextCopyToastId = 0
const copyToastTimers = new Map()
const MAX_COPY_TOASTS = 8

function removeCopyToast(id) {
  const timer = copyToastTimers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    copyToastTimers.delete(id)
  }
  const idx = copyToasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) copyToasts.value.splice(idx, 1)
}

function flashCopyNotice(text, ok = true) {
  while (copyToasts.value.length >= MAX_COPY_TOASTS) {
    const oldest = copyToasts.value[copyToasts.value.length - 1]
    removeCopyToast(oldest.id)
  }
  const id = nextCopyToastId++
  copyToasts.value.unshift({ id, text, ok })
  const timer = window.setTimeout(() => removeCopyToast(id), 2800)
  copyToastTimers.set(id, timer)
}

onUnmounted(() => {
  copyToastTimers.forEach((t) => clearTimeout(t))
  copyToastTimers.clear()
})

function clearShareUrlIfNeeded() {
  if (window.location.pathname.startsWith('/s/')) {
    window.history.replaceState(null, '', '/')
  }
}

function setShareUrlForRaw(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed) return
  const token = encodeSecretForShare(trimmed)
  if (!token) return
  const nextPath = `/s/${token}`
  const { pathname, search, hash } = window.location
  if (pathname !== nextPath) {
    window.history.replaceState(null, '', `${nextPath}${search}${hash}`)
  }
}

function showParseError(err) {
  const map = {
    empty: 'Vui lòng nhập chuỗi mã 2FA hoặc URL otpauth.',
    invalid_uri: 'URL otpauth không hợp lệ.',
    missing_secret: 'URL otpauth thiếu tham số secret.',
    invalid_secret: 'Secret trong URL không hợp lệ.',
    invalid_base32: 'Chuỗi Base32 không hợp lệ (chỉ A–Z và 2–7).',
  }
  formError.value = map[err] || 'Không đọc được secret.'
}

function generateCode() {
  formError.value = ''
  const parsed = parseUserInput(secretInput.value)
  if (parsed.error) {
    activeSecret.value = null
    showParseError(parsed.error)
    clearShareUrlIfNeeded()
    return
  }
  activeSecret.value = parsed.secret
  if (parsed.suggestedName && !nameInput.value.trim()) {
    nameInput.value = parsed.suggestedName
  }
  setShareUrlForRaw(secretInput.value)
}

function saveEntry() {
  formError.value = ''
  const parsed = parseUserInput(secretInput.value)
  if (parsed.error) {
    showParseError(parsed.error)
    clearShareUrlIfNeeded()
    return
  }
  const name = nameInput.value.trim() || parsed.suggestedName || ''
  add({ name, secret: parsed.secret })
  activeSecret.value = parsed.secret
  setShareUrlForRaw(secretInput.value)
}

async function copyCode(value) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    flashCopyNotice('Đã sao chép mã vào clipboard.', true)
  } catch {
    flashCopyNotice('Không thể sao chép. Kiểm tra quyền trình duyệt hoặc thử lại.', false)
  }
}

function onCodeDisplayKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    copyCode(code.value)
  }
}

onMounted(() => {
  const [navEntry] = performance.getEntriesByType('navigation')
  // Cmd+R / F5: không điền lại từ /s/... — ô secret (và state) đã reset; chỉ gỡ path chia sẻ.
  if (navEntry?.type === 'reload') {
    if (window.location.pathname.startsWith('/s/')) {
      window.history.replaceState(null, '', '/')
    }
    return
  }

  const token = readTokenFromPathname(window.location.pathname)
  if (!token) return
  const raw = decodeSecretFromShare(token)
  if (!raw) {
    formError.value = 'Liên kết chia sẻ không hợp lệ hoặc đã hỏng.'
    window.history.replaceState(null, '', '/')
    return
  }
  secretInput.value = raw
  generateCode()
})
</script>

<template>
  <div class="page">
    <TransitionGroup
      name="copy-toast"
      tag="div"
      class="copy-toast-stack"
      role="status"
      aria-live="polite"
    >
      <p
        v-for="t in copyToasts"
        :key="t.id"
        class="copy-notice"
        :class="t.ok ? 'copy-notice--success' : 'copy-notice--error'"
      >
        {{ t.text }}
      </p>
    </TransitionGroup>

    <main class="card">
      <h1 class="title">Authenticator — Lấy mã code từ chuỗi 2FA</h1>

      <div class="field">
        <label for="secret">Chuỗi mã 2FA hoặc URL otpauth:</label>
        <input
          id="secret"
          v-model="secretInput"
          type="text"
          class="input"
          autocomplete="off"
          spellcheck="false"
          placeholder="Base32 hoặc otpauth://totp/..."
          @keydown.enter.prevent="generateCode"
        />
      </div>

      <div class="field">
        <label for="name">Tên:</label>
        <input
          id="name"
          v-model="nameInput"
          type="text"
          class="input"
          placeholder="Đặt tên cho chuỗi mã này (tùy chọn)"
        />
      </div>

      <p v-if="formError" class="error" role="alert">{{ formError }}</p>

      <div class="actions-row">
        <button type="button" class="btn btn-primary" @click="generateCode">Tạo mã</button>
        <button type="button" class="btn btn-success" @click="saveEntry">Lưu</button>
      </div>

      <div class="code-box">
        <div
          class="code-display mono"
          :class="{ 'code-display--clickable': code }"
          :role="code ? 'button' : undefined"
          :tabindex="code ? 0 : undefined"
          :title="code ? 'Nhấn để sao chép mã' : undefined"
          :aria-label="code ? 'Sao chép mã hiện tại' : undefined"
          @click="copyCode(code)"
          @keydown="onCodeDisplayKeydown"
        >
          {{ code || '———' }}
        </div>
        <div class="progress-wrap" aria-hidden="true">
          <div
            class="progress-bar"
            :style="{
              width: `${progress * 100}%`,
              backgroundColor: progressBarColor,
            }"
          />
        </div>
      </div>

      <p class="note">
        <em
          >Lưu ý: Tính năng này sẽ lưu trên trình duyệt của bạn, nếu bạn đổi trình duyệt hoặc xóa
          cookie sẽ bị mất.</em
        >
      </p>

      <h2 class="section-title">Danh sách chuỗi mã đã lưu</h2>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thao tác</th>
              <th>Tên</th>
              <th>Chuỗi mã</th>
              <th>Mã hiện tại</th>
            </tr>
          </thead>
          <tbody>
            <SavedAccountRow
              v-for="row in entries"
              :key="row.id"
              :id="row.id"
              :name="row.name"
              :secret="row.secret"
              @remove="remove"
              @copy="copyCode"
            />
            <tr v-if="entries.length === 0">
              <td colspan="4" class="empty">Chưa có mục nào được lưu.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <aside class="about card">
      <h2 class="about-title">Về Authenticator</h2>
      <ul class="about-list">
        <li>
          Ứng dụng tạo mã gồm 6 chữ số, thay đổi mỗi 30 giây, dùng cho xác thực hai lớp (2FA /
          TOTP).
        </li>
        <li>Dùng khi trang web yêu cầu mã 2FA lúc đăng nhập.</li>
        <li>
          Hỗ trợ nhập trực tiếp secret Base32 hoặc URL dạng
          <code>otpauth://totp/Google:example@gmail.com?secret=ABCDEFG...</code>
        </li>
        <li v-if="CONTACT_LINE">{{ CONTACT_LINE }}</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.page {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.75rem 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.25rem;
  line-height: 1.3;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.35rem;
  font-size: 0.95rem;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 0.65rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.input:focus {
  outline: 2px solid #3498db;
  outline-offset: 1px;
  border-color: #3498db;
}

.error {
  color: #c0392b;
  font-size: 0.9rem;
  margin: 0 0 0.75rem;
}

.actions-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.btn {
  border: none;
  border-radius: 4px;
  padding: 0.55rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}
.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #27ae60;
  color: #fff;
}
.btn-success:hover {
  background: #219a52;
}

.btn-ghost {
  background: transparent;
  color: #3498db;
  text-decoration: underline;
  padding: 0.35rem 0;
  font-weight: 500;
}
.btn-ghost:hover {
  color: #2980b9;
}

.copy-toast-stack {
  position: fixed;
  top: max(1rem, env(safe-area-inset-top, 0px));
  right: max(1rem, env(safe-area-inset-right, 0px));
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  width: min(22rem, calc(100vw - 2rem));
  pointer-events: none;
}

.copy-notice {
  margin: 0;
  padding: 0.55rem 0.85rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: left;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  width: 100%;
  box-sizing: border-box;
}

.copy-notice--success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.copy-notice--error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.copy-toast-enter-active {
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.32s ease;
}

.copy-toast-enter-from {
  transform: translateX(calc(100% + 1.25rem));
  opacity: 0;
}

.copy-toast-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.copy-toast-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.copy-toast-leave-to {
  opacity: 0;
  transform: translateX(0.75rem) scale(0.98);
}

.copy-toast-move {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.code-box {
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  padding: 1.25rem 1rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.code-display {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #2c3e50;
}

.code-display--clickable {
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  outline-offset: 2px;
}

.code-display--clickable:hover {
  background: rgba(52, 152, 219, 0.08);
}

.code-display--clickable:focus-visible {
  outline: 2px solid #3498db;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.progress-wrap {
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition:
    width 0.2s linear,
    background-color 0.25s ease;
}

.note {
  color: #c0392b;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  line-height: 1.45;
}

.section-title {
  font-size: 1.1rem;
  margin: 1.5rem 0 0.75rem;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.65rem;
  text-align: left;
  vertical-align: top;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.empty {
  text-align: center;
  color: #7f8c8d;
  padding: 1rem !important;
}

.about {
  margin-top: 1.25rem;
  border: 2px solid #3498db;
  box-shadow: none;
}

.about-title {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: #2980b9;
}

.about-list {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.55;
  color: #34495e;
}

.about-list code {
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
