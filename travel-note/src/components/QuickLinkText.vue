<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { parseQuickLinks, QUICK_LINK_LABELS, type QuickLinkTarget } from '../utils/quickLinks'
import Icon from './Icon.vue'

const props = defineProps<{ text: string }>()

const router = useRouter()
const { currentTravelId } = useCurrentTravel()

const segments = computed(() => parseQuickLinks(props.text))

const TARGET_ICON: Record<QuickLinkTarget, string> = {
  documents: 'ticket',
  info: 'bookmark',
  checklist: 'checksquare',
}

function go(target: QuickLinkTarget, category: string) {
  if (!currentTravelId.value) return
  router.push({ name: target, params: { travelId: currentTravelId.value }, query: { category } })
}
</script>

<template>
  <span>
    <template v-for="(seg, idx) in segments" :key="idx">
      <template v-if="seg.type === 'text'">{{ seg.value }}</template>
      <button v-else type="button" class="qlink-chip" @click.stop="go(seg.target, seg.category)">
        <Icon :name="TARGET_ICON[seg.target]" :size="12" class="qlink-icon" />
        <span class="qlink-section">{{ QUICK_LINK_LABELS[seg.target] }}</span>
        <span class="qlink-category">{{ seg.category }}</span>
      </button>
    </template>
  </span>
</template>

<style scoped>
.qlink-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 2px;
  padding: 3px 9px 3px 7px;
  border: 1px solid rgba(169, 121, 44, 0.32);
  border-radius: 999px;
  background: rgba(169, 121, 44, 0.08);
  vertical-align: -3px;
  cursor: pointer;
}
.qlink-icon {
  color: var(--brass);
  flex-shrink: 0;
}
.qlink-section {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--brass);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding-right: 6px;
  border-right: 1px dashed rgba(169, 121, 44, 0.45);
  white-space: nowrap;
}
.qlink-category {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
</style>
