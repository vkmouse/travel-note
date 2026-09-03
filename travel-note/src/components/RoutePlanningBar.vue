<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useRoutePlanning } from '../composables/useRoutePlanning'

// allowEntry：這頁能不能「發起」規劃（行前清單沒有 map_url，不能發起，
// 但若已經在別頁開始規劃，切過來這裡還是要看得到工具列以便結束/開啟路線）
// selectableIds：呼叫端當下「看得到」的那批可選 id（行程頁是這一天、文件/資訊頁是這個分類），
// 「全選」只作用在這批 id 上，不會動到其他天／其他分類已經勾選的項目
const props = defineProps<{ allowEntry: boolean; selectableIds?: string[] }>()
const emit = defineEmits<{ add: [] }>()

const { currentTravelId } = useCurrentTravel()
const {
  planningRoute,
  routableItems,
  selectedCount,
  routeUrl,
  startPlanning,
  isSelected,
  toggleSelectAllForIds,
  closePlanning,
} = useRoutePlanning(currentTravelId)

const scopedIds = computed(() => props.selectableIds ?? [])
const scopedAllSelected = computed(() => scopedIds.value.length > 0 && scopedIds.value.every((id) => isSelected(id)))
function handleSelectAll() {
  toggleSelectAllForIds(scopedIds.value)
}
</script>

<template>
  <div v-if="!planningRoute && allowEntry" class="route-fab-bar">
    <button class="route-fab-btn" type="button" aria-label="新增" @click="emit('add')">
      <Icon name="plus" :size="19" />
    </button>
    <button
      class="route-fab-btn"
      type="button"
      :class="{ 'route-fab-btn--disabled': routableItems.length < 2 }"
      :disabled="routableItems.length < 2"
      :aria-label="routableItems.length < 2 ? '至少要有 2 個地點才能規劃路線' : '規劃路線'"
      @click="startPlanning"
    >
      <Icon name="compass" :size="19" />
    </button>
  </div>
  <div v-else-if="planningRoute" class="route-fab-bar">
    <button
      class="route-fab-btn"
      type="button"
      :class="{ 'route-fab-btn--disabled': scopedIds.length === 0 }"
      :disabled="scopedIds.length === 0"
      :aria-label="scopedAllSelected ? '取消全選（目前清單）' : '全選目前清單'"
      @click="handleSelectAll"
    >
      <Icon name="selectall" :size="17" />
    </button>
    <a
      v-if="routeUrl"
      class="route-fab-btn route-fab-btn--primary"
      :href="routeUrl"
      target="_blank"
      rel="noopener"
      @click="closePlanning"
    >
      <Icon name="compass" :size="16" />
      <span>{{ selectedCount }}</span>
    </a>
    <span v-else class="route-fab-btn route-fab-btn--disabled" aria-label="至少選 2 個地點">
      <Icon name="compass" :size="16" />
    </span>
    <button class="route-fab-btn" type="button" aria-label="取消規劃" @click="closePlanning">
      <Icon name="close" :size="17" />
    </button>
  </div>
</template>

<style scoped>
.route-fab-bar {
  position: fixed;
  right: max(16px, calc((100vw - 480px) / 2 + 16px));
  /* 原本 80px，nav 改版時往上推了 14px，這裡跟著推，避免貼太近 nav */
  bottom: calc(94px + var(--safe-bottom));
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px;
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 4px 14px rgba(22, 34, 58, .35);
}
.route-fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 0;
  background: none;
  color: #b9c4d6;
  text-decoration: none;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}
.route-fab-btn--primary {
  background: var(--brass);
  color: #fff;
  width: auto;
  padding: 0 14px;
}
.route-fab-btn--disabled {
  color: #5c6883;
}
button.route-fab-btn:disabled {
  cursor: not-allowed;
}
</style>
