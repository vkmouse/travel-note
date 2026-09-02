<script setup lang="ts">
import { computed } from 'vue'
import { useInfo } from '../composables/useInfo'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useCategoryFilter } from '../composables/useCategoryFilter'
import { useCrudDrawer } from '../composables/useCrudDrawer'
import { CATEGORY_ICON } from '../icons'
import { SHARED_CATEGORIES } from '../constants/categories'
import Icon from '../components/Icon.vue'
import QuickLinkText from '../components/QuickLinkText.vue'
import DrawerForm, { type DrawerField } from '../components/DrawerForm.vue'
import DrawerConfirm from '../components/DrawerConfirm.vue'
import { createInfo, deleteInfo, patchInfoChecked, updateInfo } from '../services/api'

const { currentTravelId } = useCurrentTravel()
const { items, loading, error, refresh } = useInfo(currentTravelId)
const { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete } =
  useCrudDrawer(currentTravelId, { create: createInfo, update: updateInfo, remove: deleteInfo }, refresh)
const fields: DrawerField[] = [
  { key: 'category', label: '分類', type: 'select', required: true, options: [...SHARED_CATEGORIES] },
  { key: 'title', label: '標題', type: 'text', required: true, placeholder: '輸入標題' }, { key: 'link', label: '連結', type: 'url' }, { key: 'note', label: '備註', type: 'textarea', hint: '可加入 [[行前清單:藥品]] 這類寫法，備註就會出現能直接點過去的連結' },
]
const formValues = computed(() => items.value.find((i) => i.id === editingId.value) ?? { category: fields[0]?.options?.[0] })
async function toggle(item: (typeof items.value)[number]) { if (!currentTravelId.value) return; busy.value = true; try { await patchInfoChecked(currentTravelId.value, item.id, !item.is_checked); await refresh() } catch (e) { actionError.value = e instanceof Error ? e.message : String(e) } finally { busy.value = false } }

const sortedItems = computed(() => [...items.value].sort((a, b) => a.order - b.order))
const { categories, activeCategory, filtered, grouped } = useCategoryFilter(sortedItems, (i) => i.category)
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
              <p v-if="item.note" class="info-note"><QuickLinkText :text="item.note" /></p>
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
    <DrawerForm :open="formOpen" :title="`${editingId ? '編輯' : '新增'}．常用資訊`" size="lg" :fields="fields" :initial-values="formValues" :busy="busy" @cancel="formOpen = false" @save="save" />
    <DrawerConfirm :open="deleteOpen" :title="`刪除「${items.find((i) => i.id === deletingId)?.title ?? '這一項'}」`" :busy="busy" @cancel="deleteOpen = false" @confirm="confirmDelete" />
  </section>
</template>

<style scoped>
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
</style>
