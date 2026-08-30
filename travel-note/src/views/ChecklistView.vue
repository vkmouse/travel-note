<script setup lang="ts">
import { computed } from 'vue'
import { useChecklist } from '../composables/useChecklist'
import { CATEGORY_ICON } from '../icons'
import Icon from '../components/Icon.vue'

const { items, loading, error } = useChecklist()

const sorted = computed(() => [...items.value].sort((a, b) => a.order - b.order))

const grouped = computed(() => {
  const cats = [...new Set(sorted.value.map((i) => i.category || '未分類'))]
  return cats.map((cat) => ({
    category: cat,
    rows: sorted.value.filter((i) => (i.category || '未分類') === cat),
  }))
})

const total = computed(() => items.value.length)
const done = computed(() => items.value.filter((i) => i.is_checked).length)
const progressPct = computed(() => (total.value ? (done.value / total.value) * 100 : 0))
</script>

<template>
  <section>
    <p v-if="loading" class="state-msg">載入中...</p>
    <p v-else-if="error" class="state-msg error">{{ error }}</p>
    <template v-else>
      <div class="progress-wrap">
        <div class="progress-top">
          <span class="progress-label">打包進度</span>
          <span class="progress-count">{{ done }} / {{ total }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>

      <template v-if="sorted.length">
        <template v-for="group in grouped" :key="group.category">
          <div class="section-label">
            <Icon :name="CATEGORY_ICON[group.category] || 'tag'" :size="14" />
            {{ group.category }}
          </div>
          <div v-for="item in group.rows" :key="item.id" class="info-row">
            <div class="check-dot-static">
              <div class="check-dot" :class="{ checked: item.is_checked }">
                <Icon v-if="item.is_checked" name="check" :size="15" :stroke-width="2.6" />
              </div>
            </div>
            <div class="info-body">
              <p class="info-title" :class="{ done: item.is_checked }">{{ item.title }}</p>
              <p v-if="item.note" class="info-note">{{ item.note }}</p>
            </div>
          </div>
        </template>
      </template>
      <div v-else class="empty">
        <p>清單是空的</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.progress-wrap {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 13px 15px;
  margin-bottom: 18px;
}
.progress-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.progress-label {
  font-weight: 600;
  font-size: 14px;
}
.progress-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--muted);
}
.progress-bar {
  height: 6px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--brass);
  border-radius: 99px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 9px 6px 9px 4px;
  margin-bottom: 9px;
}
.info-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
.info-title.done {
  text-decoration: line-through;
  color: var(--muted);
}
.info-note {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 3px;
}
.info-body {
  flex: 1;
  min-width: 0;
  padding-top: 9px;
}

.check-dot-static {
  padding: 9px;
  margin: -3px 0 0 -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.check-dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--line);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.check-dot.checked {
  background: var(--slate);
  border-color: var(--slate);
}
</style>
