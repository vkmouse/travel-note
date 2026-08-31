<script setup lang="ts">
import { ref, watch } from 'vue'
import { importTravel } from '../services/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; imported: [travelId: string] }>()

const text = ref('')
const busy = ref(false)
const error = ref('')

watch(() => props.open, (open) => { if (open) { text.value = ''; error.value = '' } })

async function submit() {
  const raw = text.value.trim()
  if (!raw) { error.value = '請貼上匯出的內容'; return }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    error.value = '看起來不是有效的內容，請確認完整複製了匯出的文字'
    return
  }

  busy.value = true
  error.value = ''
  try {
    const result = await importTravel(parsed)
    emit('imported', result.travel.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="匯入旅行">
      <div class="drawer-top"><div class="drawer-perf"></div><div class="drawer-handle"></div></div>
      <div class="drawer-body">
        <h3 class="drawer-title">匯入旅行</h3>
        <p class="hint">把朋友分享給你的匯出文字貼在下面，會建立成一趟全新的旅行，你會是這趟旅行的擁有者。</p>
        <textarea v-model="text" class="import-text" rows="10" placeholder="貼上匯出的文字…"></textarea>
        <p v-if="error" class="drawer-error">{{ error }}</p>
      </div>
      <div class="drawer-actions">
        <button class="btn-secondary" type="button" :disabled="busy" @click="emit('close')">取消</button>
        <button class="btn-primary" type="button" :disabled="busy" @click="submit">{{ busy ? '建立中…' : '建立旅行' }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 84vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-top { flex-shrink: 0; }
.drawer-perf { height: 12px; background-image: radial-gradient(circle 5px, var(--paper) 5px, transparent 5.5px); background-size: 22px 100%; background-position: 11px 6px; background-repeat: repeat-x; border-bottom: 1px dashed var(--line); }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px 6px; }
.drawer-title { margin: 0 0 4px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }
.hint { margin: 8px 0 12px; color: var(--muted); font-size: 12.5px; line-height: 1.5; }
.import-text { width: 100%; padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); font: 12px/1.5 'IBM Plex Mono', monospace; resize: vertical; }
.drawer-error { margin: 10px 0 0; color: var(--danger); font-size: 13px; }
.drawer-actions { display: flex; gap: 10px; flex-shrink: 0; padding: 12px 18px calc(16px + var(--safe-bottom)); border-top: 1px solid var(--line); }
.drawer-actions button { min-height: 44px; flex: 1; border: 0; border-radius: 10px; font-weight: 600; }
.btn-secondary { background: var(--paper); color: var(--ink); }
.btn-primary { background: var(--brass); color: #fff; }
button:disabled { opacity: .55; cursor: wait; }
</style>
