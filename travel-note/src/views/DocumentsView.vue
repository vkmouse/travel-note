<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { createDocument, deleteDocument, patchDocumentOrder, updateDocument } from '../services/api'
import type { DocumentItem } from '../types'

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

// ---- 拖曳排序（限制在目前篩選的分類內） ----
const dragId = ref<string | null>(null)
const dragTranslate = ref(0)
const reorderError = ref('')

// workingList 是畫面上實際渲染、拖曳中會即時重排的清單；沒有在拖曳時就跟著 filtered 走。
const workingList = ref<DocumentItem[]>([])
watch(
  filtered,
  (list) => {
    if (!dragId.value) workingList.value = [...list]
  },
  { immediate: true },
)

const itemEls = new Map<string, HTMLElement>()
function setItemRef(id: string, el: Element | null) {
  if (el instanceof HTMLElement) itemEls.set(id, el)
  else itemEls.delete(id)
}
let dragStartY = 0
let dragItemHeight = 0
let dragBaseline: DocumentItem[] = []
let dragPointerId: number | null = null

function onHandlePointerDown(e: PointerEvent, id: string) {
  if (planningRoute.value) return
  const el = itemEls.get(id)
  if (!el) return
  e.preventDefault()
  dragId.value = id
  dragTranslate.value = 0
  dragStartY = e.clientY
  dragItemHeight = el.offsetHeight + 12 // 12px = .ticket 的 margin-bottom
  dragBaseline = [...filtered.value]
  dragPointerId = e.pointerId
  el.setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragId.value || dragItemHeight <= 0) return
  const delta = e.clientY - dragStartY
  dragTranslate.value = delta

  const originIndex = dragBaseline.findIndex((d) => d.id === dragId.value)
  if (originIndex === -1) return
  const targetIndex = Math.max(
    0,
    Math.min(dragBaseline.length - 1, originIndex + Math.round(delta / dragItemHeight)),
  )
  const currentIndex = workingList.value.findIndex((d) => d.id === dragId.value)
  if (currentIndex !== -1 && currentIndex !== targetIndex) {
    const list = [...workingList.value]
    const [moved] = list.splice(currentIndex, 1)
    if (moved) {
      list.splice(targetIndex, 0, moved)
      workingList.value = list
    }
  }
}

async function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  const id = dragId.value
  const baseline = dragBaseline
  const finalList = workingList.value
  const el = id ? itemEls.get(id) : null
  if (el && dragPointerId !== null) {
    try { el.releasePointerCapture(dragPointerId) } catch { /* 已經釋放就略過 */ }
  }
  dragPointerId = null
  dragId.value = null
  dragTranslate.value = 0
  dragItemHeight = 0
  if (!id || !currentTravelId.value) return
  await persistReorder(finalList, baseline)
}

// 只重新分配「目前這批篩選結果」原本就有的 order 數值（依大小排序後照新順序套用），
// 不會動到其他分類、其他項目的 order，換過去也不會跟別的項目撞號
async function persistReorder(newList: DocumentItem[], oldList: DocumentItem[]) {
  const travelId = currentTravelId.value
  if (!travelId) return
  const orderValues = [...oldList].map((d) => d.order).sort((a, b) => a - b)
  const updates: { id: string; order: number }[] = []
  newList.forEach((doc, idx) => {
    const order = orderValues[idx]
    if (order !== undefined && order !== doc.order) updates.push({ id: doc.id, order })
  })
  if (!updates.length) return
  reorderError.value = ''
  try {
    for (const u of updates) {
      await patchDocumentOrder(travelId, u.id, u.order)
    }
    await refresh()
  } catch (e) {
    reorderError.value = e instanceof Error ? e.message : String(e)
    await refresh() // 失敗就重新抓一次，畫面對回伺服器上真正的順序
  }
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

      <TransitionGroup v-if="filtered.length" tag="div" name="doc-reorder" class="ticket-list">
        <div
          v-for="doc in workingList"
          :key="doc.id"
          :ref="(el) => setItemRef(doc.id, el as Element | null)"
          class="ticket"
          :class="{
            'ticket--select-mode': planningRoute && doc.map_url,
            'ticket--selected': planningRoute && doc.map_url && isSelected(routeId(doc.id)),
            'ticket--route-disabled': planningRoute && !doc.map_url,
            'ticket--dragging': dragId === doc.id,
          }"
          :style="dragId === doc.id ? { transform: `translateY(${dragTranslate}px)` } : undefined"
          @click="planningRoute && doc.map_url && toggleRoute(routeId(doc.id))"
        >
          <button
            v-if="!planningRoute"
            type="button"
            class="drag-handle"
            aria-label="拖曳調整順序"
            @pointerdown="onHandlePointerDown($event, doc.id)"
          >
            <Icon name="grip" :size="15" />
          </button>
          <div class="ticket-icon">
            <Icon :name="CATEGORY_ICON[doc.category] || 'tag'" :size="20" />
          </div>
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
      </TransitionGroup>
      <div v-else class="empty">
        <p>這個分類還沒有文件</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <RoutePlanningBar :allow-entry="true" :selectable-ids="selectableIds" @add="openCreate" />
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <p v-if="reorderError" class="state-msg error">{{ reorderError }}</p>
    <DrawerForm :open="formOpen" :title="`${editingId ? '編輯' : '新增'}．旅行文件`" size="lg" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
  </section>
</template>

<style scoped>
.ticket-list {
  position: relative;
}
.ticket {
  display: flex;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: background-color .15s, border-color .15s, box-shadow .15s;
}
.doc-reorder-move {
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1);
}
.ticket--dragging {
  position: relative;
  z-index: 5;
  transition: none !important;
  box-shadow: 0 10px 22px rgba(22, 34, 58, .28);
  border-color: var(--brass);
}
.drag-handle {
  flex-shrink: 0;
  width: 26px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-right: 1px solid var(--line);
  background: var(--paper-dark);
  color: var(--icon-muted);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
  background: var(--line);
  color: var(--ink);
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
