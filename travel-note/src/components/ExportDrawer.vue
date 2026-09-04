<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { exportTravel } from '../services/api'
import { useSheetDrag } from '../composables/useSheetDrag'

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

const sheetRef = ref<HTMLElement | null>(null)
const { dragY, dragging, onTouchStart, onTouchMove, onTouchEnd } = useSheetDrag(sheetRef, () => emit('close'))
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section
      ref="sheetRef"
      class="drawer-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="匯出旅行"
      :style="dragging ? { transform: `translateY(${dragY}px)`, transition: 'none' } : {}"
    >
      <div class="drawer-top" @touchstart="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd"><div class="drawer-handle"></div></div>
      <div class="drawer-body">
        <h3 class="drawer-title">匯出「{{ travelTitle }}」</h3>
        <p class="hint">複製下面這段文字傳給朋友，對方可以用「匯入旅行」建立成一趟新的旅行；如果想覆蓋更新一趟旅行的內容，改到那趟旅行的 header 用「匯入取代」貼上。不會包含成員與邀請紀錄。</p>

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
/* 殼層已搬到 style.css 全域共用，這裡只留匯出文字框跟複製按鈕 */
.hint { margin: 8px 0 12px; color: var(--muted); font-size: 12.5px; line-height: 1.5; }
.export-text { width: 100%; padding: 11px 12px; border: none; border-radius: var(--r-sm); background: var(--paper); color: var(--ink); font: 12px/1.5 var(--font-mono); box-shadow: var(--shadow-sunken); resize: vertical; }
.copy-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 44px; margin-top: 10px; border: 0; border-radius: var(--r-sm); background: var(--brass); color: #fff; font-weight: 600; font-size: 13.5px; transition: transform .12s ease; }
.copy-btn:active { transform: scale(.97); }
</style>
