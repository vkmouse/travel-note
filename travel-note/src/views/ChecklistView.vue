<script setup lang="ts">
import { computed } from 'vue'
import { useChecklist } from '../composables/useChecklist'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useCategoryFilter } from '../composables/useCategoryFilter'
import { useCrudDrawer } from '../composables/useCrudDrawer'
import { CATEGORY_ICON } from '../icons'
import { SHARED_CATEGORIES } from '../constants/categories'
import Icon from '../components/Icon.vue'
import QuickLinkText from '../components/QuickLinkText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import { createChecklist, deleteChecklist, patchChecklistChecked, updateChecklist } from '../services/api'

const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useChecklist(currentTravelId)
const { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete } =
  useCrudDrawer(currentTravelId, { create: createChecklist, update: updateChecklist, remove: deleteChecklist }, refresh)
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: [...SHARED_CATEGORIES] },
  { key: 'title', label: '項目', type: 'text', required: true }, { key: 'note', label: '備註', type: 'textarea', hint: '可加入 [[旅行文件:機票]] 這類寫法，備註就會出現能直接點過去的連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0]?.options?.[0] })
async function toggle(item: (typeof items.value)[number]) { if (!currentTravelId.value) return; busy.value = true; try { await patchChecklistChecked(currentTravelId.value, item.id, !item.is_checked); await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }

const sorted = computed(() => [...items.value].sort((a, b) => a.order - b.order))
const { categories, activeCategory, filtered, grouped } = useCategoryFilter(sorted, (i) => i.category || '未分類')

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
            <button class="check-dot-btn" aria-label="切換完成狀態" @click="toggle(item)">
              <div class="check-dot" :class="{ checked: item.is_checked }">
                <Icon v-if="item.is_checked" name="check" :size="15" :stroke-width="2.6" />
              </div>
            </button>
            <div class="info-body">
              <p class="info-title" :class="{ done: item.is_checked }">{{ item.title }}</p>
              <p v-if="item.note" class="info-note"><QuickLinkText :text="item.note" /></p>
            </div>
            <div class="card-actions"><button class="icon-btn" aria-label="編輯" @click="openEdit(item.id)"><Icon name="edit" :size="17" /></button><button class="icon-btn danger" aria-label="刪除" @click="openDelete(item.id)"><Icon name="trash" :size="17" /></button></div>
          </div>
        </template>
      </template>
      <div v-else class="empty">
        <p>{{ sorted.length ? '這個分類還沒有項目' : '清單是空的' }}</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <button class="fab" aria-label="新增清單項目" @click="openCreate"><Icon name="plus" :size="23" /></button>
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <DrawerForm :open="formOpen" :title="`${editingId ? '編輯' : '新增'}．行前清單`" size="lg" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
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
</style>
