<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Icon from './components/Icon.vue'
import AccessGate from './components/AccessGate.vue'
import { useQueryClient } from '@tanstack/vue-query'

const route = useRoute()
const queryClient = useQueryClient()

function handleAuthenticated() {
  queryClient.invalidateQueries()
}

const TABS = [
  { to: '/itinerary', name: 'itinerary', label: '每日行程', icon: 'calendar' },
  { to: '/documents', name: 'documents', label: '旅行文件', icon: 'ticket' },
  { to: '/info', name: 'info', label: '常用資訊', icon: 'bookmark' },
  { to: '/checklist', name: 'checklist', label: '行前清單', icon: 'checksquare' },
] as const
</script>

<template>
  <AccessGate @authenticated="handleAuthenticated">
  <div class="app">
    <header>
      <p class="trip-title">旅遊手札 Travel Note</p>
    </header>
    <div class="perf"></div>

    <main>
      <RouterView />
    </main>

    <nav>
      <RouterLink
        v-for="tab in TABS"
        :key="tab.name"
        :to="tab.to"
        class="nav-btn"
        :class="{ active: route.name === tab.name }"
      >
        <Icon :name="tab.icon" :size="21" :filled="route.name === tab.name" />
        {{ tab.label }}
      </RouterLink>
    </nav>
  </div>
  </AccessGate>
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
.trip-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15.5px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.perf {
  height: 2px;
  background: var(--brass);
  flex-shrink: 0;
}

main {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px calc(88px + var(--safe-bottom));
}

nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: var(--ink);
  display: flex;
  padding: 7px 6px calc(9px + var(--safe-bottom));
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
