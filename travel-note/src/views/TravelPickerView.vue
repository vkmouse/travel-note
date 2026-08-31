<script setup lang="ts">
import { ref } from 'vue'
import TravelListPanel from '../components/TravelListPanel.vue'
import MyInvitationsDrawer from '../components/MyInvitationsDrawer.vue'
import Icon from '../components/Icon.vue'
import { useMyInvitations } from '../composables/useMyInvitations'

const invitationsOpen = ref(false)
const { invitations: myInvitations } = useMyInvitations()
</script>

<template>
  <div class="picker">
    <header class="picker-header">
      <div class="picker-header-top">
        <p class="picker-brand">旅遊手札 Travel Note</p>
        <button class="picker-invite-btn" type="button" aria-label="我的邀請" @click="invitationsOpen = true">
          <Icon name="mail" :size="18" />
          <span v-if="myInvitations.length" class="picker-invite-badge">{{ myInvitations.length }}</span>
        </button>
      </div>
      <p class="picker-sub">選擇一趟旅行開始，或建立新的旅行</p>
    </header>
    <div class="picker-body">
      <TravelListPanel />
    </div>
    <MyInvitationsDrawer :open="invitationsOpen" @close="invitationsOpen = false" />
  </div>
</template>

<style scoped>
.picker {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  flex-direction: column;
}
.picker-header {
  background: var(--ink);
  color: var(--paper);
  flex-shrink: 0;
  padding: calc(var(--safe-top) + 26px) 18px 22px;
}
.picker-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.picker-brand {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}
.picker-invite-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--paper);
}
.picker-invite-btn:active {
  background: rgba(245, 242, 234, 0.1);
}
.picker-invite-badge {
  position: absolute;
  top: 2px;
  right: 2px;
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
.picker-sub {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: #9fb0c9;
}
.picker-body {
  flex: 1;
  padding: 20px 16px calc(24px + var(--safe-bottom));
}
</style>
