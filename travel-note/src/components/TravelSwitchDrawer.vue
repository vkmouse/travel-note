<script setup lang="ts">
import { ref } from 'vue'
import TravelListPanel from './TravelListPanel.vue'
import { useSheetDrag } from '../composables/useSheetDrag'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

function handlePicked() {
  emit('close')
}

const sheetRef = ref<HTMLElement | null>(null)
const { dragY, dragging, onTouchStart, onTouchMove, onTouchEnd } = useSheetDrag(sheetRef, () => emit('close'))
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section
      ref="sheetRef"
      class="drawer-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="切換旅行"
      :style="dragging ? { transform: `translateY(${dragY}px)`, transition: 'none' } : {}"
    >
      <div class="drawer-top" @touchstart="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd">
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
