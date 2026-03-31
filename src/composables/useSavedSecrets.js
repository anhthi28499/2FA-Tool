import { ref } from 'vue'

const STORAGE_KEY = 'totp-saved-accounts'

export function useSavedSecrets() {
  const entries = ref([])

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      entries.value = raw ? JSON.parse(raw) : []
      if (!Array.isArray(entries.value)) entries.value = []
    } catch {
      entries.value = []
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
  }

  function add({ name, secret }) {
    entries.value.push({
      id: crypto.randomUUID(),
      name: name?.trim() || '',
      secret,
    })
    persist()
  }

  function remove(id) {
    entries.value = entries.value.filter((e) => e.id !== id)
    persist()
  }

  load()

  return { entries, add, remove }
}
