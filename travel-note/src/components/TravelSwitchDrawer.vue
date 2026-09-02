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

<!-- 殼層已搬到 style.css 全域共用，這個元件不再需要 scoped style -->
