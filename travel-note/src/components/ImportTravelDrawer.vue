<script setup lang="ts">
import { ref, watch } from 'vue'
import { importTravel } from '../services/api'
import type { Travel } from '../types'

const props = defineProps<{ open: boolean; travels: Travel[] }>()
const emit = defineEmits<{ close: []; imported: [travelId: string] }>()

const text = ref('')
const busy = ref(false)
const error = ref('')

// 覆蓋是破壞性動作，先讓使用者在同一個 drawer 內確認要覆蓋哪一趟旅行，再真正送出
const confirming = ref(false)
const confirmTitle = ref('')
const pendingPayload = ref<unknown>(null)

watch(() => props.open, (open) => {
  if (open) { text.value = ''; error.value = ''; confirming.value = false; pendingPayload.value = null }
})

function parse(): unknown | null {
  const raw = text.value.trim()
  if (!raw) { error.value = '請貼上匯出的內容'; return null }
  try {
    return JSON.parse(raw)
  } catch {
    error.value = '看起來不是有效的內容，請確認完整複製了匯出的文字'
    return null
  }
}

function submit() {
  const parsed = parse()
  if (parsed === null) return

  // 貼上的文字帶著 travel_id，而且剛好是自己擁有的旅行，才會走覆蓋流程；
  // 其他情況一律當成一般匯入，靜默建立新旅行（實際覆蓋權限仍以後端檢查為準）
  const travelId = (parsed as Record<string, unknown>).travel_id
  const owned = typeof travelId === 'string' ? props.travels.find((t) => t.id === travelId && t.is_owner) : undefined

  error.value = ''
  if (owned) {
    confirmTitle.value = owned.title
    pendingPayload.value = parsed
    confirming.value = true
    return
  }

  void doImport(parsed)
}

async function doImport(payload: unknown) {
  busy.value = true
  error.value = ''
  try {
    const result = await importTravel(payload)
    emit('imported', result.travel.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    confirming.value = false
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="匯入旅行">
      <div class="drawer-top"><div class="drawer-handle"></div></div>

      <template v-if="!confirming">
        <div class="drawer-body">
          <h3 class="drawer-title">匯入旅行</h3>
          <p class="hint">把朋友分享給你的匯出文字貼在下面，會建立成一趟全新的旅行，你會是這趟旅行的擁有者。如果貼的是你自己這趟旅行的匯出內容，會改成覆蓋更新這趟旅行。</p>
          <textarea v-model="text" class="import-text" rows="10" placeholder="貼上匯出的文字…"></textarea>
          <p v-if="error" class="drawer-error">{{ error }}</p>
        </div>
        <div class="drawer-actions">
          <button class="btn-secondary" type="button" :disabled="busy" @click="emit('close')">取消</button>
          <button class="btn-primary" type="button" :disabled="busy" @click="submit">{{ busy ? '建立中…' : '建立旅行' }}</button>
        </div>
      </template>

      <template v-else>
        <div class="drawer-body drawer-confirm">
          <h3>覆蓋「{{ confirmTitle }}」？</h3>
          <p>這會把「{{ confirmTitle }}」目前的所有行程資料換成貼上的內容，且無法復原，確定要繼續嗎？</p>
          <p v-if="error" class="drawer-error">{{ error }}</p>
        </div>
        <div class="drawer-actions">
          <button class="btn-secondary" type="button" :disabled="busy" @click="confirming = false">返回</button>
          <button class="btn-danger" type="button" :disabled="busy" @click="doImport(pendingPayload)">{{ busy ? '覆蓋中…' : '確定覆蓋' }}</button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
/* 殼層、drawer-error、drawer-confirm、按鈕已搬到 style.css 全域共用，這裡只留匯入文字框 */
.hint { margin: 8px 0 12px; color: var(--muted); font-size: 12.5px; line-height: 1.5; }
.import-text { width: 100%; padding: 11px 12px; border: none; border-radius: var(--r-sm); background: var(--paper); color: var(--ink); font: 12px/1.5 var(--font-mono); box-shadow: var(--shadow-sunken); resize: vertical; }
</style>
