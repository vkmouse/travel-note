<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getStoredCredentials, login, storeCredentials } from '../services/auth'

const emit = defineEmits<{ authenticated: [] }>()
const authenticated = ref(false)
const checking = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const clientId = ref('')
const clientSecret = ref('')

async function check() {
  if (getStoredCredentials() && await login()) {
    authenticated.value = true
    emit('authenticated')
  }
  checking.value = false
}

async function submit() {
  const credentials = { clientId: clientId.value.trim(), clientSecret: clientSecret.value.trim() }
  if (!credentials.clientId || !credentials.clientSecret) return
  submitting.value = true
  errorMessage.value = ''
  if (await login(credentials)) {
    storeCredentials(credentials)
    authenticated.value = true
    emit('authenticated')
  } else {
    errorMessage.value = '驗證失敗，請確認 Client ID / Secret 是否正確'
  }
  submitting.value = false
}

onMounted(check)
</script>

<template>
  <slot v-if="authenticated" />
  <div v-else class="access-gate">
    <div class="access-gate__box">
      <p v-if="checking">驗證中…</p>
      <template v-else>
        <h1>請輸入存取憑證</h1>
        <label>Client ID<input v-model="clientId" type="text" autocomplete="off" /></label>
        <label>Client Secret<input v-model="clientSecret" type="password" autocomplete="off" @keyup.enter="submit" /></label>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button type="button" :disabled="submitting || !clientId.trim() || !clientSecret.trim()" @click="submit">
          {{ submitting ? '驗證中…' : '送出' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.access-gate { min-height: 100vh; width: 100%; display: grid; place-items: center; background: var(--ink); color: var(--paper); padding: 24px; box-sizing: border-box; }
.access-gate__box { width: min(320px, 100%); display: grid; gap: 14px; }
h1, p { margin: 0; }
label { display: grid; gap: 6px; font-size: 13px; }
input { padding: 10px; border: 0; border-radius: 6px; background: var(--paper); color: var(--ink); font-size: 14px; }
button { padding: 10px; border: 0; border-radius: 6px; background: var(--brass); color: var(--ink); font-weight: 700; }
.error { color: #ff9b9b; font-size: 13px; }
</style>
