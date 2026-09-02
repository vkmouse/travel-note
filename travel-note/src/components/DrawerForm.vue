<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CATEGORY_ICON } from '../icons'
import Icon from './Icon.vue'
import CalendarPicker from './CalendarPicker.vue'

export interface DrawerField {
  key: string
  label: string
  type: 'text' | 'date' | 'time' | 'url' | 'textarea' | 'select'
  required?: boolean
  options?: string[]
  hint?: string
  width?: 'full' | 'half'
  // 有值時，此日期欄位改用同一顆 CalendarPicker 一併選時間，對應的 time 欄位就不再獨立顯示
  pairedTimeKey?: string
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

// 被 pairedTimeKey 指到的欄位（如 time）已經併進對應日期的 CalendarPicker，不再單獨佔一行
const pairedTimeKeys = computed(() => new Set(props.fields.map((f) => f.pairedTimeKey).filter((k): k is string => !!k)))
const visibleFields = computed(() => props.fields.filter((f) => !pairedTimeKeys.value.has(f.key)))

// 相鄰兩個 width: 'half' 的欄位併成一行，其餘欄位各自獨佔一行
const rows = computed(() => {
  const result: DrawerField[][] = []
  const list = visibleFields.value
  let i = 0
  while (i < list.length) {
    const field = list[i]!
    const next = list[i + 1]
    if (field.width === 'half' && next?.width === 'half') {
      result.push([field, next])
      i += 2
    } else {
      result.push([field])
      i += 1
    }
  }
  return result
})

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
        <div class="drawer-handle"></div>
      </div>
      <div class="drawer-body">
        <h3 class="drawer-title">{{ title }}</h3>
        <div v-for="row in rows" :key="row.map((f) => f.key).join('-')" class="f-row" :class="{ 'f-row--split': row.length > 1 }">
          <div v-for="field in row" :key="field.key" class="f-col">
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
            <CalendarPicker
              v-else-if="field.type === 'date'"
              :model-value="form[field.key] ?? ''"
              :show-time="!!field.pairedTimeKey"
              :time="field.pairedTimeKey ? form[field.pairedTimeKey] : undefined"
              @update:model-value="(v) => (form[field.key] = v)"
              @update:time="(v) => { if (field.pairedTimeKey) form[field.pairedTimeKey] = v }"
            />
            <input v-else :id="`drawer-${field.key}`" v-model="form[field.key]" class="f-input" :type="field.type" />
            <p v-if="field.hint" class="f-hint">{{ field.hint }}</p>
          </div>
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
/* 殼層（overlay/sheet/handle/actions/輸入框/分類網格）已搬到 style.css 全域共用，這裡只留表單排版細節 */
.f-label { display: block; margin: 14px 0 5px; color: var(--muted); font-size: 12px; font-weight: 600; }
.f-row--split { display: flex; gap: 10px; }
.f-row--split .f-col { flex: 1; min-width: 0; }
.f-hint { margin: 5px 2px 0; color: var(--muted); font-size: 11px; }
</style>
