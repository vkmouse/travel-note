<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { exportTravel } from '../services/api'

const props = defineProps<{ open: boolean; travelId: string | null; travelTitle: string }>()
const emit = defineEmits<{ close: [] }>()

const loading = ref(false)
const loadError = ref('')
const text = ref('')
const copied = ref(false)

async function load() {
  if (!props.travelId) return
  loading.value = true
  loadError.value = ''
  copied.value = false
  try {
    const payload = await exportTravel(props.travelId)
    text.value = JSON.stringify(payload, null, 2)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (open) => { if (open) load() })

const textareaRef = ref<HTMLTextAreaElement | null>(null)

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
  } catch {
    // 部分瀏覽器（非 https 或權限受限）沒有 Clipboard API，退回選取文字讓使用者自己複製
    textareaRef.value?.select()
    copied.value = false
  }
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="匯出旅行">
      <div class="drawer-top"><div class="drawer-perf"></div><div class="drawer-handle"></div></div>
      <div class="drawer-body">
        <h3 class="drawer-title">匯出「{{ travelTitle }}」</h3>
        <p class="hint">複製下面這段文字傳給朋友，對方可以用「匯入旅行」還原成一趟新的旅行。不會包含成員與邀請紀錄。</p>

        <p v-if="loading" class="state-msg">匯出中...</p>
        <p v-else-if="loadError" class="state-msg error">{{ loadError }}</p>
        <template v-else>
          <textarea ref="textareaRef" class="export-text" readonly rows="10" :value="text" @click="($event.target as HTMLTextAreaElement).select()"></textarea>
          <button class="copy-btn" type="button" @click="copy">
            <Icon :name="copied ? 'check' : 'copy'" :size="15" />{{ copied ? '已複製' : '複製文字' }}
          </button>
        </template>
      </div>
      <div class="drawer-actions">
        <button class="btn-secondary" type="button" @click="emit('close')">關閉</button>
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
.export-text { width: 100%; padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); font: 12px/1.5 'IBM Plex Mono', monospace; resize: vertical; }
.copy-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 44px; margin-top: 10px; border: 0; border-radius: 10px; background: var(--brass); color: #fff; font-weight: 600; font-size: 13.5px; }
.state-msg { text-align: center; color: var(--muted); font-size: 13px; padding: 28px 10px; }
.state-msg.error { color: var(--danger); }
.drawer-actions { display: flex; gap: 10px; flex-shrink: 0; padding: 12px 18px calc(16px + var(--safe-bottom)); border-top: 1px solid var(--line); }
.drawer-actions button { min-height: 44px; flex: 1; border: 0; border-radius: 10px; font-weight: 600; }
.btn-secondary { background: var(--paper); color: var(--ink); }
</style>
