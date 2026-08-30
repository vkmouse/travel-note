<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocuments } from '../composables/useDocuments'
import { CATEGORY_ICON } from '../icons'
import Icon from '../components/Icon.vue'

const { items, loading, error } = useDocuments()

const categories = computed(() => ['全部', ...new Set(items.value.map((d) => d.category))])
const activeCategory = ref('全部')

const filtered = computed(() =>
  items.value
    .filter((d) => activeCategory.value === '全部' || d.category === activeCategory.value)
    .sort((a, b) => a.order - b.order),
)

function fmtDate(d: string | null) {
  if (!d) return ''
  const parts = d.split('-')
  return `${parts[1]}/${parts[2]}`
}
function dateRange(doc: { date_start: string | null; date_end: string | null }) {
  if (!doc.date_start) return ''
  return doc.date_end ? `${fmtDate(doc.date_start)} – ${fmtDate(doc.date_end)}` : fmtDate(doc.date_start)
}
</script>

<template>
  <section>
    <p v-if="loading" class="state-msg">載入中...</p>
    <p v-else-if="error" class="state-msg error">{{ error }}</p>
    <template v-else>
      <div v-if="categories.length > 1" class="filter-row">
        <div
          v-for="c in categories"
          :key="c"
          class="filter-chip"
          :class="{ active: c === activeCategory }"
          @click="activeCategory = c"
        >
          {{ c }}
        </div>
      </div>

      <div v-if="filtered.length">
        <div v-for="doc in filtered" :key="doc.id" class="ticket">
          <div class="ticket-icon">
            <Icon :name="CATEGORY_ICON[doc.category] || 'tag'" :size="20" />
          </div>
          <div class="ticket-divider"></div>
          <div class="ticket-body">
            <div class="ticket-head">
              <div>
                <div class="ticket-cat">{{ doc.category }}</div>
                <p class="ticket-title">{{ doc.title }}</p>
              </div>
            </div>
            <div v-if="dateRange(doc)" class="ticket-dates">{{ dateRange(doc) }}</div>
            <div v-if="doc.note" class="ticket-note">{{ doc.note }}</div>
            <a v-if="doc.link" class="ticket-link" :href="doc.link" target="_blank" rel="noopener">
              <Icon name="link" :size="13" />
              開啟連結
            </a>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <p>這個分類還沒有文件</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 16px;
  scrollbar-width: none;
}
.filter-row::-webkit-scrollbar {
  display: none;
}
.filter-chip {
  flex-shrink: 0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 11px 15px;
  min-height: 40px;
  display: flex;
  align-items: center;
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
}
.filter-chip.active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.ticket {
  display: flex;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
}
.ticket-icon {
  width: 50px;
  flex-shrink: 0;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ticket-divider {
  width: 0;
  border-left: 1.5px dashed var(--line);
  position: relative;
}
.ticket-divider::before,
.ticket-divider::after {
  content: '';
  position: absolute;
  width: 11px;
  height: 11px;
  background: var(--paper);
  border-radius: 50%;
  left: -6px;
}
.ticket-divider::before {
  top: -6px;
}
.ticket-divider::after {
  bottom: -6px;
}
.ticket-body {
  padding: 11px 8px 11px 14px;
  flex: 1;
  min-width: 0;
}
.ticket-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}
.ticket-cat {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--brass);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.ticket-title {
  font-weight: 600;
  font-size: 14.5px;
  margin: 4px 0 0;
}
.ticket-dates {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  margin: 6px 0 4px;
}
.ticket-note {
  font-size: 12.5px;
  color: var(--muted);
}
.ticket-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
  text-decoration: none;
}
</style>
