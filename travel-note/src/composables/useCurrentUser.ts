import { computed, ref } from 'vue'

// module-level ref：登入成功後由 services/auth.ts 寫入，不做持久化
const currentEmail = ref<string | null>(null)

export function setCurrentEmail(email: string | null) {
  currentEmail.value = email
}

export function useCurrentUser() {
  return { currentEmail: computed(() => currentEmail.value) }
}
