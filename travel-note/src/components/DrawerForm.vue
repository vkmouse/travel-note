<script setup lang="ts">
import { ref, watch } from 'vue'
import { CATEGORY_ICON } from '../icons'
import Icon from './Icon.vue'

export interface DrawerField {
  key: string
  label: string
  type: 'text' | 'date' | 'time' | 'url' | 'textarea' | 'select'
  required?: boolean
  options?: string[]
}

const props = defineProps<{
  open: boolean
  title: string
  size: 'sm' | 'lg'
  fields: DrawerField[]
  initialValues: object
  busy?: boolean
}>()

const emit = defineEmits<{
  save: [values: Record<string, string>]
  cancel: []
}>()

const form = ref<Record<string, string>>({})
const error = ref('')

function reset() {
  const values = props.initialValues as Record<string, unknown>
  form.value = Object.fromEntries(props.fields.map((field) => [field.key, String(values[field.key] ?? '')]))
  error.value = ''
}

watch(() => props.open, (open) => { if (open) reset() }, { immediate: true })

function submit() {
  const missing = props.fields.find((field) => field.required && !form.value[field.key]?.trim())
  if (missing) {
    error.value = `請填寫「${missing.label}」`
    return
  }
  error.value = ''
  emit('save', { ...form.value })
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('cancel')">
    <section class="drawer-sheet" :class="`drawer-sheet--${size}`" role="dialog" aria-modal="true" :aria-label="title">
      <div class="drawer-top">
        <div class="drawer-perf"></div>
        <div class="drawer-handle"></div>
      </div>
      <div class="drawer-body">
        <h3 class="drawer-title">{{ title }}</h3>
        <div v-for="field in fields" :key="field.key">
          <span v-if="field.type === 'select'" class="f-label" :id="`drawer-${field.key}-label`">{{ field.label }}</span>
          <label v-else class="f-label" :for="`drawer-${field.key}`">{{ field.label }}</label>
          <div v-if="field.type === 'select'" class="f-grid" role="radiogroup" :aria-labelledby="`drawer-${field.key}-label`">
            <button
              v-for="option in field.options"
              :key="option"
              type="button"
              class="f-grid-opt"
              :class="{ 'f-grid-opt--active': form[field.key] === option }"
              role="radio"
              :aria-checked="form[field.key] === option"
              @click="form[field.key] = option"
            >
              <Icon :name="CATEGORY_ICON[option] || 'tag'" :size="19" />
              <span>{{ option }}</span>
            </button>
          </div>
          <textarea v-else-if="field.type === 'textarea'" :id="`drawer-${field.key}`" v-model="form[field.key]" class="f-input" rows="2"></textarea>
          <input v-else :id="`drawer-${field.key}`" v-model="form[field.key]" class="f-input" :type="field.type" />
        </div>
        <p v-if="error" class="drawer-error">{{ error }}</p>
      </div>
      <div class="drawer-actions">
        <button class="btn-secondary" type="button" :disabled="busy" @click="emit('cancel')">取消</button>
        <button class="btn-primary" type="button" :disabled="busy" @click="submit">{{ busy ? '儲存中…' : '儲存' }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-sheet--sm { max-height: 56vh; }
.drawer-top { flex-shrink: 0; }
.drawer-perf { height: 12px; background-image: radial-gradient(circle 5px, var(--paper) 5px, transparent 5.5px); background-size: 22px 100%; background-position: 11px 6px; background-repeat: repeat-x; border-bottom: 1px dashed var(--line); }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px 6px; }
.drawer-title { margin: 0 0 4px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }
.f-label { display: block; margin: 14px 0 5px; color: var(--muted); font-size: 12px; font-weight: 600; }
.f-input { width: 100%; padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); font: 14px 'Inter', sans-serif; }
textarea.f-input { resize: vertical; min-height: 60px; }
.f-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 8px; }
.f-grid-opt { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--card); color: var(--icon-muted); font: 12px 'Inter', sans-serif; }
.f-grid-opt span { color: var(--ink); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.f-grid-opt--active { background: var(--ink); border-color: var(--ink); color: #fff; }
.f-grid-opt--active span { color: #fff; }
.drawer-error { margin: 10px 0 0; color: var(--danger); font-size: 13px; }
.drawer-actions { display: flex; gap: 10px; flex-shrink: 0; padding: 12px 18px calc(16px + var(--safe-bottom)); border-top: 1px solid var(--line); }
.drawer-actions button { min-height: 44px; flex: 1; border: 0; border-radius: 10px; font-weight: 600; }
.btn-secondary { background: var(--paper); color: var(--ink); }
.btn-primary { background: var(--brass); color: #fff; }
button:disabled { opacity: .55; cursor: wait; }
</style>
