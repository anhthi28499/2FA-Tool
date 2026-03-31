<script setup>
import { ref, computed } from 'vue'
import { parseUserInput } from './utils/parseOtpauth'
import { useTotp } from './composables/useTotp'
import { useSavedSecrets } from './composables/useSavedSecrets'
import SavedAccountRow from './components/SavedAccountRow.vue'

/** Đổi dòng này nếu bạn muốn hiển thị liên hệ trong footer */
const CONTACT_LINE = 'SĐT: 0848877758 — Ngô Anh Dũng'

const secretInput = ref('')
const nameInput = ref('')
const formError = ref('')
const activeSecret = ref(null)

const { entries, add, remove } = useSavedSecrets()
const { code, progress } = useTotp(activeSecret)

const hasActiveCode = computed(() => Boolean(code.value))

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
    return
  }
  activeSecret.value = parsed.secret
  if (parsed.suggestedName && !nameInput.value.trim()) {
    nameInput.value = parsed.suggestedName
  }
}

function saveEntry() {
  formError.value = ''
  const parsed = parseUserInput(secretInput.value)
  if (parsed.error) {
    showParseError(parsed.error)
    return
  }
  const name = nameInput.value.trim() || parsed.suggestedName || ''
  add({ name, secret: parsed.secret })
  activeSecret.value = parsed.secret
}

async function copyCode(value) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="page">
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
        <div class="code-display mono">{{ code || '———' }}</div>
        <div class="progress-wrap" aria-hidden="true">
          <div class="progress-bar" :style="{ width: `${progress * 100}%` }" />
        </div>
      </div>

      <p class="note">
        <em
          >Lưu ý: Tính năng này sẽ lưu trên trình duyệt của bạn, nếu bạn đổi trình duyệt hoặc xóa
          cookie sẽ bị mất.</em
        >
      </p>

      <button
        v-if="hasActiveCode"
        type="button"
        class="btn btn-ghost copy-main"
        @click="copyCode(code)"
      >
        Copy mã hiện tại
      </button>

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

.copy-main {
  margin-bottom: 1rem;
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
  background: #e74c3c;
  transition: width 0.2s linear;
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
