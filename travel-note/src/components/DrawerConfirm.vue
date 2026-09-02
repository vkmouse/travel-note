<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{ open: boolean; title: string; busy?: boolean }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <!-- 常疊在其他 drawer（如成員列表）之上，用 --elevated 讓 z-index/陰影都高過底下那層 -->
  <div v-if="open" class="drawer-overlay drawer-overlay--elevated" @click.self="emit('cancel')">
    <section class="drawer-sheet drawer-sheet--sm" role="dialog" aria-modal="true" :aria-label="title">
      <div class="drawer-top"><div class="drawer-handle"></div></div>
      <div class="drawer-body drawer-confirm">
        <div class="drawer-confirm-icon"><Icon name="trash" :size="20" :stroke-width="1.9" /></div>
        <h3>{{ title }}？</h3>
        <p>刪除後無法復原，請確認是否繼續。</p>
      </div>
      <div class="drawer-actions">
        <button class="btn-secondary" type="button" :disabled="busy" @click="emit('cancel')">取消</button>
        <button class="btn-danger" type="button" :disabled="busy" @click="emit('confirm')">{{ busy ? '刪除中…' : '刪除' }}</button>
      </div>
    </section>
  </div>
</template>
