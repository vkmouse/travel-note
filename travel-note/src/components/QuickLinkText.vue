<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { parseQuickLinks, type QuickLinkTarget } from '../utils/quickLinks'
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
        <Icon :name="TARGET_ICON[seg.target]" :size="12" />
        {{ seg.category }}
      </button>
    </template>
  </span>
</template>

<style scoped>
.qlink-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 2px;
  padding: 2px 8px 2px 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  color: var(--slate);
  font-size: 11.5px;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
  vertical-align: middle;
  cursor: pointer;
}
</style>
