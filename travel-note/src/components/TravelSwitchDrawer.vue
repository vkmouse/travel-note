<script setup lang="ts">
import TravelListPanel from './TravelListPanel.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

function handlePicked() {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="切換旅行">
      <div class="drawer-top">
        <div class="drawer-handle"></div>
      </div>
      <div class="drawer-body">
        <h3 class="drawer-title">切換旅行</h3>
        <TravelListPanel @picked="handlePicked" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 82vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-top { flex-shrink: 0; }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px calc(20px + var(--safe-bottom)); }
.drawer-title { margin: 0 0 14px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }
</style>
