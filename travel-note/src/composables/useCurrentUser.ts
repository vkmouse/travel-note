import { computed, ref } from 'vue'

// module-level ref，不做持久化：重新整理頁面即清空，需重新登入
const currentEmail = ref<string | null>(null)

export function setCurrentEmail(email: string | null) {
  currentEmail.value = email
}

export function useCurrentUser() {
  return { currentEmail: computed(() => currentEmail.value) }
}
