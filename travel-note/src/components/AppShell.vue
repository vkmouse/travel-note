<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Icon from './Icon.vue'
import TravelPickerView from '../views/TravelPickerView.vue'
import TravelSwitchDrawer from './TravelSwitchDrawer.vue'
import MembersDrawer from './MembersDrawer.vue'
import MyInvitationsDrawer from './MyInvitationsDrawer.vue'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { useTravels } from '../composables/useTravels'
import { useMyInvitations } from '../composables/useMyInvitations'
import { useTravelPrefetch } from '../composables/useTravelPrefetch'

const route = useRoute()

const { currentTravelId } = useCurrentTravel()
const { travels, refresh: refreshTravels } = useTravels()

// AppShell 切分頁不會重新掛載，只有換旅行時 currentTravelId 才變，
// 在這裡 prefetch 才能讓四個分頁都提前拿到資料、切換時不再 loading
const { prefetchAll } = useTravelPrefetch()
watch(currentTravelId, (id) => { if (id) prefetchAll(id) }, { immediate: true })
const currentTravel = computed(() => travels.value.find((t) => t.id === currentTravelId.value) ?? null)
const switcherOpen = ref(false)
const membersOpen = ref(false)
const invitationsOpen = ref(false)

// 待處理邀請角標數字，跟 TravelPickerView 共用同一份 vue-query 快取
const { invitations: myInvitations } = useMyInvitations()

function handleMembersChanged() {
  refreshTravels()
}

const TABS = [
  { name: 'itinerary', label: '每日行程', icon: 'calendar' },
  { name: 'documents', label: '旅行文件', icon: 'ticket' },
  { name: 'info', label: '常用資訊', icon: 'bookmark' },
  { name: 'checklist', label: '行前清單', icon: 'checksquare' },
] as const
</script>

<template>
  <TravelPickerView v-if="!currentTravelId" />
  <div v-else class="app">
    <header>
      <button class="trip-switch" type="button" @click="switcherOpen = true">
        <span class="app-name">旅遊手札</span>
        <span class="trip-title">{{ currentTravel?.title ?? '' }}<Icon name="chevrondown" :size="13" /></span>
      </button>
      <div class="header-actions">
        <button class="header-icon-btn" type="button" aria-label="成員與邀請" @click="membersOpen = true">
          <Icon name="users" :size="19" />
        </button>
        <button class="header-icon-btn" type="button" aria-label="我的邀請" @click="invitationsOpen = true">
          <Icon name="mail" :size="19" />
          <span v-if="myInvitations.length" class="header-badge">{{ myInvitations.length }}</span>
        </button>
      </div>
    </header>
    <div class="perf"></div>

    <main>
      <RouterView />
    </main>

    <nav>
      <RouterLink
        v-for="tab in TABS"
        :key="tab.name"
        :to="{ name: tab.name, params: { travelId: String(currentTravelId) } }"
        replace
        class="nav-btn"
        :class="{ active: route.name === tab.name }"
      >
        <Icon :name="tab.icon" :size="21" :filled="route.name === tab.name" />
        {{ tab.label }}
      </RouterLink>
    </nav>

    <TravelSwitchDrawer :open="switcherOpen" @close="switcherOpen = false" />
    <MembersDrawer
      :open="membersOpen"
      :travel-id="currentTravelId"
      :is-owner="currentTravel?.is_owner ?? false"
      @close="membersOpen = false"
      @changed="handleMembersChanged"
    />
    <MyInvitationsDrawer :open="invitationsOpen" @close="invitationsOpen = false" />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
  position: relative;
}

header {
  background: var(--ink);
  color: var(--paper);
  flex-shrink: 0;
  padding: calc(var(--safe-top) + 7px) 18px 7px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.trip-switch {
  background: none;
  border: none;
  color: var(--paper);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  cursor: pointer;
  min-height: 44px;
  justify-content: center;
}
.app-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brass);
}
.trip-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15.5px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  line-height: 1.1;
  display: flex;
  align-items: center;
  gap: 4px;
}
.perf {
  height: 2px;
  background: var(--brass);
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.header-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--paper);
}
.header-icon-btn:active {
  background: rgba(245, 242, 234, 0.1);
}
.header-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--brass);
  color: #fff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--ink);
}

main {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px calc(102px + var(--safe-bottom));
}

nav {
  position: fixed;
  /* 從貼齊 0 往上推一點，避免緊貼手機實體邊緣（尤其是有 home indicator 的機型）導致最下排按鈕不好點 */
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: var(--ink);
  display: flex;
  padding: 7px 6px calc(9px + var(--safe-bottom));
  box-shadow: 0 8px 24px rgba(22, 34, 58, .28);
  z-index: 10;
}
.nav-btn {
  flex: 1;
  background: none;
  border: none;
  color: #7c8ca6;
  font-family: 'Inter', sans-serif;
  font-size: 10.5px;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 2px;
  cursor: pointer;
  border-radius: 10px;
  text-decoration: none;
}
.nav-btn :deep(.cutout) {
  fill: var(--ink);
}
.nav-btn :deep(.cutout-stroke) {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nav-btn.active {
  color: #fff;
}
.nav-btn.active :deep(svg) {
  color: var(--brass);
}
</style>
