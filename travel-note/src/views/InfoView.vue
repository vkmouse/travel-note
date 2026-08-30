<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInfo } from '../composables/useInfo'
import { CATEGORY_ICON } from '../icons'
import Icon from '../components/Icon.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import { createInfo, deleteInfo, patchInfoChecked, updateInfo } from '../services/api'

const { items, loading, error, refresh } = useInfo()
const formOpen = ref(false); const deleteOpen = ref(false); const editingId = ref<string | null>(null); const deletingId = ref<string | null>(null); const busy = ref(false); const actionError = ref('')
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: ['工具', '靈感', '緊急聯絡'] },
  { key: 'title', label: '標題', type: 'text', required: true }, { key: 'link', label: '連結', type: 'url' }, { key: 'note', label: '備註', type: 'textarea' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0].options?.[0] })
function openCreate() { editingId.value = null; actionError.value = ''; formOpen.value = true }
function openEdit(id: string) { editingId.value = id; actionError.value = ''; formOpen.value = true }
function openDelete(id: string) { deletingId.value = id; actionError.value = ''; deleteOpen.value = true }
async function save(values: Record<string, string>) { busy.value = true; try { if (editingId.value) await updateInfo(editingId.value, values); else await createInfo(values as never); formOpen.value = false; await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }
async function toggle(item: (typeof items.value)[number]) { busy.value = true; try { await patchInfoChecked(item.id, !item.is_checked); await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }
async function confirmDelete() { if (!deletingId.value) return; busy.value = true; try { await deleteInfo(deletingId.value); deleteOpen.value = false; await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }

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
            <button class="check-dot-btn" aria-label="切換完成狀態" @click="toggle(item)">
              <div class="check-dot" :class="{ checked: item.is_checked }">
                <Icon v-if="item.is_checked" name="check" :size="15" :stroke-width="2.6" />
              </div>
            </button>
            <div class="info-body">
              <p class="info-title" :class="{ done: item.is_checked }">{{ item.title }}</p>
              <p v-if="item.note" class="info-note">{{ item.note }}</p>
              <a v-if="item.link" class="info-link" :href="item.link" target="_blank" rel="noopener">
                <Icon name="link" :size="13" />
                開啟連結
              </a>
            </div>
            <div class="card-actions"><button class="icon-btn" aria-label="編輯" @click="openEdit(item.id)"><Icon name="edit" :size="17" /></button><button class="icon-btn danger" aria-label="刪除" @click="openDelete(item.id)"><Icon name="trash" :size="17" /></button></div>
          </div>
        </template>
      </template>
      <div v-else class="empty">
        <p>這裡還沒有資料</p>
        <button class="empty-add-btn" @click="openCreate"><Icon name="plus" :size="14" />新增一筆</button>
      </div>
    </template>
    <button class="fab" aria-label="新增資訊" @click="openCreate"><Icon name="plus" :size="23" /></button>
    <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
    <DrawerForm :open="formOpen" :title="`${editingId ? '編輯' : '新增'}．常用資訊`" size="sm" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
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
