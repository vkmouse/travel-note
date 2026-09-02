<script setup lang="ts">
// 通用「點一下展開、點一下摺疊」欄位外殼，摘要列走 summary slot，展開內容走預設 slot
defineProps<{ expanded: boolean }>()

const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()
</script>

<template>
  <div class="expandable-field" :class="{ expanded }">
    <button type="button" class="expandable-summary" :aria-expanded="expanded" @click="emit('update:expanded', !expanded)">
      <span class="expandable-summary-content"><slot name="summary" /></span>
      <svg class="expandable-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <div v-if="expanded" class="expandable-body"><slot /></div>
  </div>
</template>

<style scoped>
.expandable-field {
  border-radius: var(--r-sm);
  background: var(--paper);
  overflow: hidden;
  box-shadow: var(--shadow-raised);
  transition: background .15s ease, box-shadow .15s ease;
}
/* 展開時換成內凹陰影，跟摺疊時的「可點按凸起」做出區隔，不用邊框切開 */
.expandable-field.expanded {
  background: var(--card);
  box-shadow: var(--shadow-sunken);
}
.expandable-summary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font: 14px var(--font-body);
  color: var(--ink);
  text-align: left;
}
.expandable-summary-content {
  flex: 1;
  min-width: 0;
}
.expandable-chevron {
  flex-shrink: 0;
  color: var(--icon-muted);
  transition: transform .2s ease;
}
.expandable-field.expanded .expandable-chevron {
  transform: rotate(180deg);
}
.expandable-body {
  padding: 0 12px 12px;
}
</style>
