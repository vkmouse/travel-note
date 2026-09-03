<script setup lang="ts">
import Icon from './Icon.vue'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useRoutePlanning } from '../composables/useRoutePlanning'

// allowEntry：這頁能不能「發起」規劃（行前清單沒有 map_url，不能發起，
// 但若已經在別頁開始規劃，切過來這裡還是要看得到工具列以便結束/開啟路線）
defineProps<{ allowEntry: boolean }>()

const { currentTravelId } = useCurrentTravel()
const { planningRoute, routableItems, selectedCount, allSelected, routeUrl, startPlanning, toggleSelectAll, closePlanning } =
  useRoutePlanning(currentTravelId)
</script>

<template>
  <button
    v-if="!planningRoute && allowEntry && routableItems.length >= 2"
    class="route-fab-entry"
    type="button"
    aria-label="規劃路線"
    @click="startPlanning"
  >
    <Icon name="compass" :size="19" />
  </button>
  <div v-else-if="planningRoute" class="route-fab-bar">
    <button class="route-fab-btn" type="button" :aria-label="allSelected ? '取消全選' : '全選'" @click="toggleSelectAll">
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
.route-fab-entry {
  position: fixed;
  right: max(16px, calc((100vw - 480px) / 2 + 16px));
  bottom: calc(140px + var(--safe-bottom));
  z-index: 20;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--brass);
  box-shadow: var(--shadow-raised);
  display: flex;
  align-items: center;
  justify-content: center;
}
.route-fab-bar {
  position: fixed;
  right: max(16px, calc((100vw - 480px) / 2 + 16px));
  bottom: calc(80px + var(--safe-bottom));
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
</style>
