<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useItinerary } from '../composables/useItinerary'
import Icon from '../components/Icon.vue'

const { items, loading, error } = useItinerary()

const days = computed(() => [...new Set(items.value.map((i) => i.date))].sort())
const activeDay = ref<string | null>(null)

watch(
  days,
  (list) => {
    if (!activeDay.value || !list.includes(activeDay.value)) {
      activeDay.value = list[0] ?? null
    }
  },
  { immediate: true },
)

const dayItems = computed(() =>
  activeDay.value
    ? items.value.filter((i) => i.date === activeDay.value).sort((a, b) => a.order - b.order)
    : [],
)

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
function weekday(d: string) {
  return '週' + WEEKDAYS[new Date(d).getDay()]
}
function dayNum(d: string) {
  return parseInt(d.split('-')[2] ?? '0', 10)
}
</script>

<template>
  <section>
    <p v-if="loading" class="state-msg">載入中...</p>
    <p v-else-if="error" class="state-msg error">{{ error }}</p>
    <template v-else>
      <div v-if="days.length" class="day-scroller">
        <div
          v-for="d in days"
          :key="d"
          class="day-chip"
          :class="{ active: d === activeDay }"
          @click="activeDay = d"
        >
          <div class="dow">{{ weekday(d) }}</div>
          <div class="dnum">{{ dayNum(d) }}</div>
        </div>
      </div>

      <div v-if="dayItems.length" class="timeline">
        <div v-for="(it, idx) in dayItems" :key="it.id" class="tl-item">
          <div class="tl-rail">
            <div class="tl-dot"></div>
            <div v-if="idx !== dayItems.length - 1" class="tl-line"></div>
          </div>
          <div style="flex: 1">
            <div class="tl-time">{{ it.time || '整天' }}</div>
            <div class="tl-card">
              <div class="tl-card-head">
                <p class="tl-title">{{ it.title }}</p>
              </div>
              <p v-if="it.location" class="tl-loc">
                <Icon name="pin" :size="13" />
                {{ it.location }}
              </p>
              <p v-if="it.note" class="tl-note">{{ it.note }}</p>
              <a v-if="it.map_url" class="map-link" :href="it.map_url" target="_blank" rel="noopener">
                <Icon name="compass" :size="13" />
                查看地圖
              </a>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <p>{{ days.length ? '這天還沒有安排行程' : '尚未新增任何行程' }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.day-scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 20px;
  scrollbar-width: none;
}
.day-scroller::-webkit-scrollbar {
  display: none;
}
.day-chip {
  flex-shrink: 0;
  background: var(--ink);
  border-radius: var(--r-sm);
  padding: 10px 15px;
  text-align: center;
  cursor: pointer;
  min-width: 56px;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #8fa3c0;
  border-bottom: 3px solid transparent;
}
.day-chip .dow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.day-chip .dnum {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 18px;
  margin-top: 2px;
  color: #dce4ee;
}
.day-chip.active {
  border-bottom-color: var(--brass);
}
.day-chip.active .dnum {
  color: #fff;
}
.day-chip.active .dow {
  color: var(--brass);
}

.timeline {
  position: relative;
  padding-left: 2px;
}
.tl-item {
  display: flex;
  gap: 14px;
  position: relative;
  padding-bottom: 18px;
}
.tl-item:last-child {
  padding-bottom: 0;
}
.tl-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
}
.tl-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--slate);
  margin-top: 5px;
  flex-shrink: 0;
}
.tl-line {
  flex: 1;
  width: 1px;
  background: var(--line);
  margin-top: 3px;
}
.tl-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  color: var(--slate);
  font-weight: 600;
  margin-bottom: 5px;
}
.tl-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 12px 10px 12px 14px;
  flex: 1;
}
.tl-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}
.tl-title {
  font-weight: 600;
  font-size: 14.5px;
  margin: 0;
  flex: 1;
}
.tl-loc {
  font-size: 12.5px;
  color: var(--muted);
  margin: 4px 0 2px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.tl-note {
  font-size: 12.5px;
  color: var(--muted);
  margin: 6px 0 0;
}
.map-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 9px;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
  text-decoration: none;
}
</style>
