<script setup lang="ts">
import { computed } from 'vue'
import { useDocuments } from '../composables/useDocuments'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useCategoryFilter } from '../composables/useCategoryFilter'
import { useCrudDrawer } from '../composables/useCrudDrawer'
import { CATEGORY_ICON } from '../icons'
import { SHARED_CATEGORIES } from '../constants/categories'
import Icon from '../components/Icon.vue'
import QuickLinkText from '../components/QuickLinkText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import { createDocument, deleteDocument, updateDocument } from '../services/api'

const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useDocuments(currentTravelId)
const { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete } =
  useCrudDrawer(currentTravelId, { create: createDocument, update: updateDocument, remove: deleteDocument }, refresh)
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: [...SHARED_CATEGORIES] },
  { key: 'title', label: '名稱', type: 'text', required: true, placeholder: '輸入文件名稱' },
  { key: 'date_start', label: '開始', type: 'date', width: 'half' },
  { key: 'date_end', label: '結束', type: 'date', width: 'half' },
  { key: 'link', label: '連結', type: 'url' }, { key: 'note', label: '備註', type: 'textarea', hint: '可加入 [[常用資訊:緊急聯絡]] 這類寫法，備註就會出現能直接點過去的連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0]?.options?.[0] })

const sortedItems = computed(() => [...items.value].sort((a, b) => a.order - b.order))
const { categories, activeCategory, filtered } = useCategoryFilter(sortedItems, (d) => d.category)

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
              <div class="card-actions"><button class="icon-btn" aria-label="編輯" @click="openEdit(doc.id)"><Icon name="edit" :size="17" /></button><button class="icon-btn danger" aria-label="刪除" @click="openDelete(doc.id)"><Icon name="trash" :size="17" /></button></div>
            </div>
            <div v-if="dateRange(doc)" class="ticket-dates">{{ dateRange(doc) }}</div>
            <div v-if="doc.note" class="ticket-note"><QuickLinkText :text="doc.note" /></div>
            <a v-if="doc.link" class="ticket-link" :href="doc.link" target="_blank" rel="noopener">
              <Icon name="link" :size="13" />
              開啟連結
            </a>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <p>這個分類還沒有文件</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <button class="fab" aria-label="新增文件" @click="openCreate"><Icon name="plus" :size="23" /></button>
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <DrawerForm :open="formOpen" :title="`${editingId ? '編輯' : '新增'}．旅行文件`" size="lg" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
  </section>
</template>

<style scoped>
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
