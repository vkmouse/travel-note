<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{ open: boolean; title: string; busy?: boolean }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('cancel')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" :aria-label="title">
      <div class="drawer-top"><div class="drawer-perf"></div><div class="drawer-handle"></div></div>
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

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 56vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-top { flex-shrink: 0; }
.drawer-perf { height: 12px; background-image: radial-gradient(circle 5px, var(--paper) 5px, transparent 5.5px); background-size: 22px 100%; background-position: 11px 6px; background-repeat: repeat-x; border-bottom: 1px dashed var(--line); }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; padding: 14px 18px 6px; }
.drawer-confirm { text-align: center; padding-top: 8px; }
.drawer-confirm-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; border-radius: 50%; background: rgba(179,57,44,.1); color: var(--danger); }
.drawer-confirm h3 { margin: 0 0 6px; font: 700 16px 'Space Grotesk', sans-serif; }
.drawer-confirm p { margin: 0; color: var(--muted); font-size: 13.5px; }
.drawer-actions { display: flex; gap: 10px; flex-shrink: 0; padding: 12px 18px calc(16px + var(--safe-bottom)); border-top: 1px solid var(--line); }
.drawer-actions button { min-height: 44px; flex: 1; border: 0; border-radius: 10px; font-weight: 600; }
.btn-secondary { background: var(--paper); color: var(--ink); }
.btn-danger { background: var(--danger); color: #fff; }
button:disabled { opacity: .55; cursor: wait; }
</style>
