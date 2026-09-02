<script setup lang="ts">
// 有沒有時間只差最下面一段 time-row，月曆格子本身的邏輯共用一份，所以合成同一個元件用 showTime 切換
import { computed, ref, watch } from 'vue'
import { WEEKDAY_LABELS, weekdayLabel, todayDateKey, nowTimeValue, daysInMonth, firstWeekdayOfMonth, buildDateKey } from '../utils/date'

const props = defineProps<{
  modelValue: string
  time?: string
  showTime?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:time': [value: string]
}>()

const expanded = ref(false)

function yearMonthOf(dateKey: string): [number, number] {
  const [y, m] = (dateKey || todayDateKey()).split('-').map(Number)
  return [y!, m! - 1]
}

const [initYear, initMonth] = yearMonthOf(props.modelValue)
const viewYear = ref(initYear)
const viewMonth = ref(initMonth)

// 切換新增/編輯項目時 modelValue 會被外部重置，日曆要跳回對應月份
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    const [y, m] = yearMonthOf(v)
    viewYear.value = y
    viewMonth.value = m
  },
)

interface CalendarDay {
  day: number
  dateKey: string
  isCurrentMonth: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const days: CalendarDay[] = []

  const leading = firstWeekdayOfMonth(y, m)
  const prevMonth = m === 0 ? 11 : m - 1
  const prevYear = m === 0 ? y - 1 : y
  const prevMonthDays = daysInMonth(prevYear, prevMonth)
  for (let i = leading - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    days.push({ day, dateKey: buildDateKey(prevYear, prevMonth, day), isCurrentMonth: false })
  }

  const total = daysInMonth(y, m)
  for (let day = 1; day <= total; day++) {
    days.push({ day, dateKey: buildDateKey(y, m, day), isCurrentMonth: true })
  }

  // 只補到當週結束，不固定塞滿 6 週，手機上比較省高度
  const nextMonth = m === 11 ? 0 : m + 1
  const nextYear = m === 11 ? y + 1 : y
  const weekCount = Math.ceil(days.length / 7)
  const remaining = weekCount * 7 - days.length
  for (let day = 1; day <= remaining; day++) {
    days.push({ day, dateKey: buildDateKey(nextYear, nextMonth, day), isCurrentMonth: false })
  }

  return days
})

const viewMonthLabel = computed(() => `${viewYear.value} 年 ${viewMonth.value + 1} 月`)
const todayKey = computed(() => todayDateKey())

function isSelected(dateKey: string) {
  return dateKey === props.modelValue
}
function isToday(dateKey: string) {
  return dateKey === todayKey.value
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value -= 1 } else { viewMonth.value -= 1 }
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value += 1 } else { viewMonth.value += 1 }
}

function selectDay(day: CalendarDay) {
  emit('update:modelValue', day.dateKey)
  if (!day.isCurrentMonth) {
    const [y, m] = yearMonthOf(day.dateKey)
    viewYear.value = y
    viewMonth.value = m
  }
}

function selectToday() {
  const key = todayDateKey()
  emit('update:modelValue', key)
  if (props.showTime) emit('update:time', nowTimeValue())
  const [y, m] = yearMonthOf(key)
  viewYear.value = y
  viewMonth.value = m
}

function handleTimeInput(e: Event) {
  emit('update:time', (e.target as HTMLInputElement).value || '00:00')
}

const summaryLabel = computed(() => {
  if (!props.modelValue) return props.showTime ? '選擇日期與時間' : '選擇日期'
  const [y, m, d] = props.modelValue.split('-')
  const base = `${y}/${m}/${d} 週${weekdayLabel(props.modelValue)}`
  return props.showTime ? `${base} ${props.time || '00:00'}` : base
})
</script>

<template>
  <div class="cal-field" :class="{ expanded }">
    <button type="button" class="cal-summary" :aria-expanded="expanded" @click="expanded = !expanded">
      <span>{{ summaryLabel }}</span>
      <svg class="cal-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>

    <div v-if="expanded" class="cal-body">
      <div class="cal-nav">
        <button type="button" class="cal-arrow" aria-label="上個月" @click="prevMonth">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
        </button>
        <span class="cal-title">{{ viewMonthLabel }}</span>
        <button type="button" class="cal-arrow" aria-label="下個月" @click="nextMonth">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <button type="button" class="cal-today-btn" @click="selectToday">{{ showTime ? '現在' : '今天' }}</button>
      </div>

      <div class="cal-weekdays">
        <span v-for="label in WEEKDAY_LABELS" :key="label">{{ label }}</span>
      </div>

      <div class="cal-grid">
        <button
          v-for="day in calendarDays"
          :key="day.dateKey"
          type="button"
          class="cal-day"
          :class="{ 'other-month': !day.isCurrentMonth, selected: isSelected(day.dateKey), today: isToday(day.dateKey) }"
          @click="selectDay(day)"
        >
          {{ day.day }}
        </button>
      </div>

      <input v-if="showTime" type="time" class="cal-time-input" :value="time || '00:00'" @input="handleTimeInput" />
    </div>
  </div>
</template>

<style scoped>
.cal-field {
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--paper);
  overflow: hidden;
}
.cal-summary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font: 14px 'Inter', sans-serif;
  color: var(--ink);
  text-align: left;
}
.cal-chevron {
  flex-shrink: 0;
  color: var(--icon-muted);
  transition: transform 0.2s ease;
}
.cal-field.expanded .cal-chevron {
  transform: rotate(180deg);
}
.cal-body {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--line);
  background: var(--card);
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.cal-title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
}
.cal-arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--icon-muted);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-arrow:hover {
  background: var(--paper);
}
.cal-today-btn {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 99px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.cal-weekdays span {
  display: block;
  text-align: center;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--muted);
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
}
.cal-day.other-month {
  color: var(--muted);
  opacity: 0.5;
}
.cal-day.today {
  border: 1px solid var(--brass);
  font-weight: 700;
}
.cal-day.selected {
  background: var(--brass);
  color: #fff;
  font-weight: 700;
}
.cal-time-input {
  width: 100%;
  margin-top: 10px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--paper);
  color: var(--ink);
  font: 13px 'Inter', sans-serif;
}
</style>
