<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTravels } from '../composables/useTravels'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import Icon from './Icon.vue'
import DrawerForm, { type DrawerField } from './DrawerForm.vue'
import DrawerConfirm from './DrawerConfirm.vue'
import ExportDrawer from './ExportDrawer.vue'
import ImportTravelDrawer from './ImportTravelDrawer.vue'
import { createTravel, deleteTravel, loadSampleTravel, updateTravel } from '../services/api'

const emit = defineEmits<{ picked: [id: string] }>()

const { travels, loading, error, refresh } = useTravels()
const { currentTravelId, selectTravel, clearTravel } = useCurrentTravel()

const formOpen = ref(false)
const deleteOpen = ref(false)
const editingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const busy = ref(false)
const sampleBusy = ref(false)
const actionError = ref('')

const exportOpen = ref(false)
const exportingId = ref<string | null>(null)
const importOpen = ref(false)

const fields: DrawerField[] = [
  { key: 'title', label: '旅行名稱', type: 'text', required: true },
  { key: 'date_start', label: '開始日期', type: 'date' },
  { key: 'date_end', label: '結束日期', type: 'date' },
]

const formValues = computed(() => travels.value.find((t) => t.id === editingId.value) ?? { title: '' })
const exportingTitle = computed(() => travels.value.find((t) => t.id === exportingId.value)?.title ?? '')

function openCreate() { editingId.value = null; actionError.value = ''; formOpen.value = true }
function openEdit(id: string) { editingId.value = id; actionError.value = ''; formOpen.value = true }
function openDelete(id: string) { deletingId.value = id; actionError.value = ''; deleteOpen.value = true }
function openExport(id: string) { exportingId.value = id; exportOpen.value = true }

async function handleImported(travelId: string) {
  importOpen.value = false
  selectTravel(travelId)
  emit('picked', travelId)
  await refresh()
}

function pick(id: string) {
  selectTravel(id)
  emit('picked', id)
}

async function save(values: Record<string, string>) {
  busy.value = true
  actionError.value = ''
  try {
    if (editingId.value) {
      await updateTravel(editingId.value, values)
    } else {
      const created = await createTravel(values as never)
      selectTravel(created.travel.id)
      emit('picked', created.travel.id)
    }
    formOpen.value = false
    await refresh()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function confirmDelete() {
  if (!deletingId.value) return
  busy.value = true
  try {
    await deleteTravel(deletingId.value)
    if (currentTravelId.value === deletingId.value) clearTravel()
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function loadSample() {
  sampleBusy.value = true
  actionError.value = ''
  try {
    const result = await loadSampleTravel()
    selectTravel(result.travel.id)
    emit('picked', result.travel.id)
    await refresh()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    sampleBusy.value = false
  }
}

function fmtRange(t: { date_start: string | null; date_end: string | null }) {
  if (!t.date_start) return '尚未設定日期'
  return t.date_end && t.date_end !== t.date_start ? `${t.date_start} – ${t.date_end}` : t.date_start
}
</script>

<template>
  <div class="travel-panel">
    <p v-if="loading" class="state-msg">載入中...</p>
    <p v-else-if="error" class="state-msg error">{{ error }}</p>
    <template v-else>
      <div v-if="travels.length" class="travel-list">
        <div
          v-for="t in travels"
          :key="t.id"
          class="travel-card"
          :class="{ active: t.id === currentTravelId }"
          @click="pick(t.id)"
        >
          <div class="travel-card-icon" :class="{ active: t.id === currentTravelId }">
            <Icon name="suitcase" :size="18" />
            <span v-if="t.id === currentTravelId" class="travel-card-check"><Icon name="check" :size="10" :stroke-width="3" /></span>
          </div>
          <div class="travel-card-body">
            <p class="travel-card-title">
              {{ t.title }}
              <span v-if="!t.is_owner" class="shared-tag"><Icon name="users" :size="10" />共享</span>
            </p>
            <p class="travel-card-range">{{ fmtRange(t) }}</p>
          </div>
          <div class="card-actions" @click.stop>
            <button class="icon-btn" aria-label="編輯" @click="openEdit(t.id)"><Icon name="edit" :size="17" /></button>
            <button class="icon-btn" aria-label="匯出" @click="openExport(t.id)"><Icon name="download" :size="17" /></button>
            <!-- 刪除整趟旅行只有擁有者能做 -->
            <button v-if="t.is_owner" class="icon-btn danger" aria-label="刪除" @click="openDelete(t.id)"><Icon name="trash" :size="17" /></button>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <p>尚未建立任何旅行</p>
        <button class="empty-add-btn" :disabled="sampleBusy" @click="loadSample">
          <Icon name="suitcase" :size="14" />{{ sampleBusy ? '建立中…' : '載入範例行程' }}
        </button>
      </div>
    </template>
    <div class="travel-bottom-actions">
      <button class="travel-add-btn" @click="openCreate"><Icon name="plus" :size="15" />新增旅行</button>
      <button class="travel-import-btn" @click="importOpen = true"><Icon name="upload" :size="15" />匯入旅行</button>
    </div>
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>

    <DrawerForm :open="formOpen" :title="editingId ? '編輯旅行' : '新增旅行'" size="sm" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${travels.find((t) => t.id === deletingId)?.title ?? '這趟旅行'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
    <ExportDrawer :open="exportOpen" :travel-id="exportingId" :travel-title="exportingTitle" @close="exportOpen = false" />
    <ImportTravelDrawer :open="importOpen" @close="importOpen = false" @imported="handleImported" />
  </div>
</template>

<style scoped>
.travel-panel {
  display: flex;
  flex-direction: column;
}
.travel-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.travel-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 12px 8px 12px 12px;
  cursor: pointer;
}
.travel-card.active {
  border-color: var(--brass);
}
.travel-card-icon {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brass);
  flex-shrink: 0;
}
.travel-card-icon.active {
  background: var(--brass);
  color: #fff;
}
.travel-card-check {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--brass);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--card);
}
.travel-card-body {
  flex: 1;
  min-width: 0;
}
.travel-card-title {
  font-weight: 600;
  font-size: 14.5px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}
.shared-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--slate);
  background: var(--paper);
  padding: 2px 7px 2px 6px;
  border-radius: 999px;
}
.travel-card-range {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  color: var(--muted);
  margin: 3px 0 0;
}
.travel-bottom-actions {
  display: flex;
  gap: 8px;
}
.travel-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  min-height: 46px;
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
  background: none;
  color: var(--ink);
  font-weight: 600;
  font-size: 13.5px;
}
.travel-add-btn:active {
  background: var(--paper);
}
.travel-import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  min-height: 46px;
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
  background: none;
  color: var(--muted);
  font-weight: 600;
  font-size: 13.5px;
}
.travel-import-btn:active {
  background: var(--paper);
}
</style>
