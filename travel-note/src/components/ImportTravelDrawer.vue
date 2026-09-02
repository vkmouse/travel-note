<script setup lang="ts">
import { ref, watch } from 'vue'
import { importTravel } from '../services/api'

const props = withDefaults(
  defineProps<{
    open: boolean
    // 'create'：清單／切換旅行 drawer 用，一律建立成一趟全新旅行，不帶 travel_id
    // 'replace'：旅行頁面 header 用，會把貼上的內容覆蓋掉目前這趟旅行
    mode?: 'create' | 'replace'
    travelId?: string | null
    travelTitle?: string
  }>(),
  { mode: 'create', travelId: null, travelTitle: '' },
)
const emit = defineEmits<{ close: []; imported: [travelId: string] }>()

const text = ref('')
const busy = ref(false)
const error = ref('')

// 取代模式一定要先確認，跟一般建立不同，這裡不再靠猜測貼上內容裡有沒有 travel_id，
// 而是由「使用者是從哪個入口點進來匯入」直接決定
const confirming = ref(false)
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
  error.value = ''

  if (props.mode === 'replace') {
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
    const result = await importTravel(payload, props.mode === 'replace' ? (props.travelId ?? undefined) : undefined)
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
    <section class="drawer-sheet" role="dialog" aria-modal="true" :aria-label="mode === 'replace' ? '匯入取代這趟旅行' : '匯入旅行'">
      <div class="drawer-top"><div class="drawer-handle"></div></div>

      <template v-if="!confirming">
        <div class="drawer-body">
          <h3 class="drawer-title">{{ mode === 'replace' ? `匯入取代「${travelTitle}」` : '匯入旅行' }}</h3>
          <p class="hint">
            {{
              mode === 'replace'
                ? '把匯出的文字貼在下面，下一步會請你再次確認：這會把目前這趟旅行的所有內容換成貼上的內容，且無法復原。'
                : '把朋友分享給你的匯出文字貼在下面，會建立成一趟全新的旅行，你會是這趟旅行的擁有者。'
            }}
          </p>
          <textarea v-model="text" class="import-text" rows="10" placeholder="貼上匯出的文字…"></textarea>
          <p v-if="error" class="drawer-error">{{ error }}</p>
        </div>
        <div class="drawer-actions">
          <button class="btn-secondary" type="button" :disabled="busy" @click="emit('close')">取消</button>
          <button class="btn-primary" type="button" :disabled="busy" @click="submit">
            {{ mode === 'replace' ? '下一步' : (busy ? '建立中…' : '建立旅行') }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="drawer-body drawer-confirm">
          <h3>覆蓋「{{ travelTitle }}」？</h3>
          <p>這會把「{{ travelTitle }}」目前的所有行程資料換成貼上的內容，且無法復原，確定要繼續嗎？</p>
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
