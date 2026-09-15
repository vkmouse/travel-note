<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useChecklist } from '../composables/useChecklist'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useCategoryFilter } from '../composables/useCategoryFilter'
import { useCrudDrawer } from '../composables/useCrudDrawer'
import { useRoutePlanning } from '../composables/useRoutePlanning'
import { CATEGORY_ICON } from '../icons'
import { SHARED_CATEGORIES } from '../constants/categories'
import Icon from '../components/Icon.vue'
import NoteText from '../components/NoteText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import RoutePlanningBar from '../components/RoutePlanningBar.vue'
import { createChecklist, deleteChecklist, patchChecklistChecked, patchChecklistOrder, updateChecklist } from '../services/api'
import type { ChecklistItem } from '../types'

const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useChecklist(currentTravelId)
// 行前清單沒有 map_url，不能發起規劃，但若已經在別頁開始規劃，這裡還是要看得到懸浮工具列
const { planningRoute } = useRoutePlanning(currentTravelId)
const { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete } =
  useCrudDrawer(currentTravelId, { create: createChecklist, update: updateChecklist, remove: deleteChecklist }, refresh)
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: [...SHARED_CATEGORIES] },
  { key: 'title', label: '項目', type: 'text', required: true, placeholder: '輸入項目名稱' }, { key: 'note', label: '備註', type: 'textarea', hint: '支援 markdown：**粗體**、*斜體*、`代碼`、- 清單、[文字](網址)。連結目標打成 [機票資訊](旅行文件/機票) 這種路徑，就會變成能直接點過去的內部連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0]?.options?.[0] })
async function toggle(item: (typeof items.value)[number]) { if (!currentTravelId.value) return; busy.value = true; try { await patchChecklistChecked(currentTravelId.value, item.id, !item.is_checked); await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }

const sorted = computed(() => [...items.value].sort((a, b) => a.order - b.order))
const { categories, activeCategory, filtered, grouped } = useCategoryFilter(sorted, (i) => i.category || '未分類')

const total = computed(() => items.value.length)
const done = computed(() => items.value.filter((i) => i.is_checked).length)
const progressPct = computed(() => (total.value ? (done.value / total.value) * 100 : 0))

// ---- 拖曳排序（限制在同一個分類群組內） ----
const dragId = ref<string | null>(null)
const dragTranslate = ref(0)
const reorderError = ref('')

// workingList 依「分類分組後」攤平：同分類的項目在陣列中一定連續，
// 拖曳時只在同分類的連續區段內搬動，不會影響其他分類的順序。
const workingList = ref<ChecklistItem[]>([])
watch(
  grouped,
  (groups) => {
    if (!dragId.value) workingList.value = groups.flatMap((g) => g.rows)
  },
  { immediate: true, deep: true },
)
const workingGrouped = computed(() => {
  const cats = [...new Set(workingList.value.map((i) => i.category || '未分類'))]
  return cats.map((cat) => ({ category: cat, rows: workingList.value.filter((i) => (i.category || '未分類') === cat) }))
})

const itemEls = new Map<string, HTMLElement>()
function setItemRef(id: string, el: Element | null) {
  if (el instanceof HTMLElement) itemEls.set(id, el)
  else itemEls.delete(id)
}
let dragStartY = 0
let dragItemHeight = 0
let dragBaseline: ChecklistItem[] = []
let dragPointerId: number | null = null

function onHandlePointerDown(e: PointerEvent, id: string) {
  const el = itemEls.get(id)
  if (!el) return
  e.preventDefault()
  dragId.value = id
  dragTranslate.value = 0
  dragStartY = e.clientY
  dragItemHeight = el.offsetHeight + 9 // 9px = .info-row 的 margin-bottom
  dragBaseline = [...workingList.value]
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

  const dragged = dragBaseline.find((i) => i.id === dragId.value)
  if (!dragged) return
  const category = dragged.category || '未分類'
  const catIndices = dragBaseline.reduce<number[]>((arr, it, i) => {
    if ((it.category || '未分類') === category) arr.push(i)
    return arr
  }, [])
  const originIndex = dragBaseline.findIndex((i) => i.id === dragId.value)
  const originPos = catIndices.indexOf(originIndex)
  const targetPos = Math.max(0, Math.min(catIndices.length - 1, originPos + Math.round(delta / dragItemHeight)))
  const targetIndex = catIndices[targetPos]
  const currentIndex = workingList.value.findIndex((i) => i.id === dragId.value)
  if (currentIndex !== -1 && targetIndex !== undefined && currentIndex !== targetIndex) {
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
  const dragged = baseline.find((i) => i.id === id)
  if (dragged) await persistReorder(finalList, baseline, dragged.category || '未分類')
}

// 只重新分配「同一個分類」原本就有的 order 數值（依大小排序後照新順序套用），
// 不會動到其他分類的 order，換過去也不會跟別的項目撞號
async function persistReorder(newList: ChecklistItem[], oldList: ChecklistItem[], category: string) {
  const travelId = currentTravelId.value
  if (!travelId) return
  const oldCatItems = oldList.filter((i) => (i.category || '未分類') === category)
  const newCatItems = newList.filter((i) => (i.category || '未分類') === category)
  const orderValues = oldCatItems.map((i) => i.order).sort((a, b) => a - b)
  const updates: { id: string; order: number }[] = []
  newCatItems.forEach((item, idx) => {
    const order = orderValues[idx]
    if (order !== undefined && order !== item.order) updates.push({ id: item.id, order })
  })
  if (!updates.length) return
  reorderError.value = ''
  try {
    for (const u of updates) {
      await patchChecklistOrder(travelId, u.id, u.order)
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
        <template v-for="group in workingGrouped" :key="group.category">
          <div class="section-label">
            <Icon :name="CATEGORY_ICON[group.category] || 'tag'" :size="14" />
            {{ group.category }}
          </div>
          <TransitionGroup tag="div" name="reorder" class="group-list">
            <div
              v-for="item in group.rows"
              :key="item.id"
              :ref="(el) => setItemRef(item.id, el as Element | null)"
              class="info-row"
              :class="{ 'info-row--dragging': dragId === item.id }"
              :style="dragId === item.id ? { transform: `translateY(${dragTranslate}px)` } : undefined"
            >
              <button
                v-if="!planningRoute"
                type="button"
                class="row-drag-handle"
                aria-label="拖曳調整順序"
                @pointerdown="onHandlePointerDown($event, item.id)"
              >
                <Icon name="grip" :size="15" />
              </button>
              <button class="check-dot-btn" aria-label="切換完成狀態" @click="toggle(item)">
                <div class="check-dot" :class="{ checked: item.is_checked }">
                  <Icon v-if="item.is_checked" name="check" :size="15" :stroke-width="2.6" />
                </div>
              </button>
              <div class="info-body">
                <p class="info-title" :class="{ done: item.is_checked }">{{ item.title }}</p>
                <div v-if="item.note" class="info-note"><NoteText :text="item.note" /></div>
              </div>
              <div class="card-actions"><button class="icon-btn" aria-label="編輯" @click="openEdit(item.id)"><Icon name="edit" :size="17" /></button><button class="icon-btn danger" aria-label="刪除" @click="openDelete(item.id)"><Icon name="trash" :size="17" /></button></div>
            </div>
          </TransitionGroup>
        </template>
      </template>
      <div v-else class="empty">
        <p>{{ sorted.length ? '這個分類還沒有項目' : '清單是空的' }}</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <button v-if="!planningRoute" class="fab" aria-label="新增清單項目" @click="openCreate"><Icon name="plus" :size="23" /></button>
    <RoutePlanningBar :allow-entry="false" />
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <p v-if="reorderError" class="state-msg error">{{ reorderError }}</p>
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
.group-list {
  position: relative;
}
.info-row--dragging {
  position: relative;
  z-index: 5;
  transition: none !important;
  box-shadow: 0 10px 22px rgba(22, 34, 58, .28);
  border-color: var(--brass);
}
</style>
