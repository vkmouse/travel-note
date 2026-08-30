<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInfo } from '../composables/useInfo'
import { CATEGORY_ICON } from '../icons'
import Icon from '../components/Icon.vue'

const { items, loading, error } = useInfo()

const categories = computed(() => ['全部', ...new Set(items.value.map((i) => i.category))])
const activeCategory = ref('全部')

const filtered = computed(() =>
  items.value
    .filter((i) => activeCategory.value === '全部' || i.category === activeCategory.value)
    .sort((a, b) => a.order - b.order),
)

const grouped = computed(() => {
  const cats = [...new Set(filtered.value.map((i) => i.category))]
  return cats.map((cat) => ({
    category: cat,
    rows: filtered.value.filter((i) => i.category === cat),
  }))
})
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

      <template v-if="filtered.length">
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
              <a v-if="item.link" class="info-link" :href="item.link" target="_blank" rel="noopener">
                <Icon name="link" :size="13" />
                開啟連結
              </a>
            </div>
          </div>
        </template>
      </template>
      <div v-else class="empty">
        <p>這裡還沒有資料</p>
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
.info-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate);
  text-decoration: none;
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
