<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItinerary } from '../composables/useItinerary'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import Icon from '../components/Icon.vue'
import NoteText from '../components/NoteText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import { createItinerary, deleteItinerary, updateItinerary } from '../services/api'

const route = useRoute()
const router = useRouter()
const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useItinerary(currentTravelId)
const formOpen = ref(false)
const deleteOpen = ref(false)
const editingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const busy = ref(false)
const actionError = ref('')
const fields: DrawerField[] = [
  { key: 'date', label: '日期時間', type: 'date', required: true, pairedTimeKey: 'time' }, { key: 'time', label: '時間', type: 'time' },
  { key: 'title', label: '行程名稱', type: 'text', required: true, placeholder: '輸入行程名稱' }, { key: 'location', label: '地點', type: 'text' },
  { key: 'map_url', label: '地圖連結', type: 'url' }, { key: 'note', label: '備註', type: 'textarea', hint: '支援 markdown：**粗體**、*斜體*、`代碼`、- 清單、[文字](網址)。連結目標打成 [住宿資訊](旅行文件/住宿) 這種路徑，就會變成能直接點過去的內部連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { date: '' })
function openCreate() { editingId.value = null; actionError.value = ''; formOpen.value = true }
function openEdit(id: string) { editingId.value = id; actionError.value = ''; formOpen.value = true }
function openDelete(id: string) { deletingId.value = id; actionError.value = ''; deleteOpen.value = true }
async function save(values: Record<string, string>) { if (!currentTravelId.value) return; busy.value = true; actionError.value = ''; try { if (editingId.value) await updateItinerary(currentTravelId.value, editingId.value, values); else await createItinerary(currentTravelId.value, values as never); formOpen.value = false; await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }
async function confirmDelete() { if (!deletingId.value || !currentTravelId.value) return; busy.value = true; try { await deleteItinerary(currentTravelId.value, deletingId.value); deleteOpen.value = false; await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }

const days = computed(() => [...new Set(items.value.map((i) => i.date))].sort())

// 帶著目前選的日期在網址上（用 replace，切換日期不會多堆歷史紀錄），
// 從行程備註點快速連結跳到其他分頁後按上一頁，才能準確回到原本看的那一天，而不是重置回第一天
const activeDay = ref<string | null>(typeof route.query.date === 'string' ? route.query.date : null)

watch(
  days,
  (list) => {
    // 資料還沒載入完成時 list 是空的，先不要動 activeDay，避免把網址上帶著的日期洗掉
    if (list.length === 0) return
    if (!activeDay.value || !list.includes(activeDay.value)) {
      activeDay.value = list[0] ?? null
    }
  },
  { immediate: true },
)

watch(
  activeDay,
  (day) => {
    if (day && route.query.date !== day) {
      router.replace({ query: { ...route.query, date: day } })
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
              <div class="tl-card-head"><p class="tl-title">{{ it.title }}</p><div class="card-actions"><button class="icon-btn" aria-label="編輯" @click="openEdit(it.id)"><Icon name="edit" :size="17" /></button><button class="icon-btn danger" aria-label="刪除" @click="openDelete(it.id)"><Icon name="trash" :size="17" /></button></div></div>
              </div>
              <p v-if="it.location" class="tl-loc">
                <Icon name="pin" :size="13" />
                {{ it.location }}
              </p>
              <div v-if="it.note" class="tl-note"><NoteText :text="it.note" /></div>
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
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <button class="fab" aria-label="新增行程" @click="openCreate"><Icon name="plus" :size="23" /></button>
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <DrawerForm :open="formOpen" title="行程" size="lg" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
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
