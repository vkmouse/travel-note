<script setup lang="ts">
import { computed } from 'vue'
import { useDocuments } from '../composables/useDocuments'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useCategoryFilter } from '../composables/useCategoryFilter'
import { useCrudDrawer } from '../composables/useCrudDrawer'
import { useRoutePlanning } from '../composables/useRoutePlanning'
import { useMapPlaceName } from '../composables/useMapPlaceName'
import { CATEGORY_ICON } from '../icons'
import { SHARED_CATEGORIES } from '../constants/categories'
import Icon from '../components/Icon.vue'
import NoteText from '../components/NoteText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import RoutePlanningBar from '../components/RoutePlanningBar.vue'
import { createDocument, deleteDocument, updateDocument } from '../services/api'

const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useDocuments(currentTravelId)
const { planningRoute, selectedCount, isSelected, selectionNumber, toggle: toggleRoute } = useRoutePlanning(currentTravelId)
const { placeNameOf } = useMapPlaceName()
function routeId(id: string) { return `documents:${id}` }
const { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete } =
  useCrudDrawer(currentTravelId, { create: createDocument, update: updateDocument, remove: deleteDocument }, refresh)
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: [...SHARED_CATEGORIES] },
  { key: 'title', label: '名稱', type: 'text', required: true, placeholder: '輸入文件名稱' },
  { key: 'date_start', label: '開始日期', type: 'date', placeholder: '開始日期' },
  { key: 'date_end', label: '結束日期', type: 'date', placeholder: '結束日期' },
  { key: 'map_url', label: '連結', type: 'url', placeholder: 'Google Maps 短網址' }, { key: 'note', label: '備註', type: 'textarea', hint: '支援 markdown：**粗體**、*斜體*、`代碼`、- 清單、[文字](網址)。連結目標打成 [緊急聯絡](常用資訊/緊急聯絡) 這種路徑，就會變成能直接點過去的內部連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0]?.options?.[0] })

const sortedItems = computed(() => [...items.value].sort((a, b) => a.order - b.order))
const { categories, activeCategory, filtered } = useCategoryFilter(sortedItems, (d) => d.category)

// 「全選」的範圍：只有目前這個分類（含「全部」時就是整頁）、且有連結的項目
const selectableIds = computed(() => filtered.value.filter((d) => d.map_url).map((d) => routeId(d.id)))

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

      <p v-if="planningRoute" class="route-hint">點選卡片加入路線・已選 {{ selectedCount }} 個地點</p>

      <div v-if="filtered.length">
        <div
          v-for="doc in filtered"
          :key="doc.id"
          class="ticket"
          :class="{
            'ticket--select-mode': planningRoute && doc.map_url,
            'ticket--selected': planningRoute && doc.map_url && isSelected(routeId(doc.id)),
            'ticket--route-disabled': planningRoute && !doc.map_url,
          }"
          @click="planningRoute && doc.map_url && toggleRoute(routeId(doc.id))"
        >
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
              <div v-if="!(planningRoute && doc.map_url)" class="card-actions">
                <button class="icon-btn" aria-label="編輯" @click="openEdit(doc.id)"><Icon name="edit" :size="17" /></button>
                <button class="icon-btn danger" aria-label="刪除" @click="openDelete(doc.id)"><Icon name="trash" :size="17" /></button>
              </div>
              <div v-else class="route-select-badge" :class="{ 'route-select-badge--on': isSelected(routeId(doc.id)) }">
                {{ selectionNumber(routeId(doc.id)) }}
              </div>
            </div>
            <div v-if="dateRange(doc)" class="ticket-dates">{{ dateRange(doc) }}</div>
            <a
              v-if="doc.map_url && !planningRoute"
              class="ticket-loc ticket-loc--link"
              :href="doc.map_url"
              target="_blank"
              rel="noopener"
              @click.stop
            >
              <Icon name="pin" :size="13" />
              {{ placeNameOf(doc.map_url) || '開啟連結' }}
            </a>
            <p v-else-if="placeNameOf(doc.map_url)" class="ticket-loc">
              <Icon name="pin" :size="13" />
              {{ placeNameOf(doc.map_url) }}
            </p>
            <div v-if="doc.note" class="ticket-note"><NoteText :text="doc.note" /></div>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <p>這個分類還沒有文件</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <RoutePlanningBar :allow-entry="true" :selectable-ids="selectableIds" @add="openCreate" />
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
  transition: background-color .15s, border-color .15s, box-shadow .15s;
}
.ticket--select-mode {
  cursor: pointer;
  user-select: none;
}
.ticket--select-mode:active {
  background: rgba(169, 121, 44, 0.06);
}
.ticket--selected {
  border-color: var(--brass);
  background: rgba(169, 121, 44, 0.08);
  box-shadow: var(--shadow-raised);
}
.ticket--route-disabled {
  border-color: var(--paper-dark);
  filter: grayscale(0.5);
  opacity: 0.55;
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
.ticket-loc {
  font-size: 12.5px;
  color: var(--muted);
  margin: 6px 0 2px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.ticket-loc--link {
  color: var(--slate);
  font-weight: 600;
  text-decoration: none;
}
.ticket-loc--link:hover {
  text-decoration: underline;
}
.ticket-note {
  font-size: 12.5px;
  color: var(--muted);
}
.route-select-badge {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  transition: background-color .15s, border-color .15s, color .15s;
}
.route-select-badge--on {
  background: var(--brass);
  border-color: var(--brass);
  color: #fff;
}
.route-hint {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--muted);
}
</style>
