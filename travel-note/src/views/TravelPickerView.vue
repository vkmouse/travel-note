<script setup lang="ts">
import TravelListPanel from '../components/TravelListPanel.vue'
</script>

<template>
  <div class="picker">
    <header class="picker-header">
      <p class="picker-brand">旅遊手札 Travel Note</p>
      <p class="picker-sub">選擇一趟旅行開始，或建立新的旅行</p>
    </header>
    <div class="picker-body">
      <TravelListPanel />
    </div>
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
.picker-brand {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
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
