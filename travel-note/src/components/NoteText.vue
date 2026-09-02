<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentTravel } from '../composables/useCurrentTravel'
import { parseNoteBlocks, QUICK_LINK_LABELS, type QuickLinkTarget } from '../utils/noteMarkdown'
import Icon from './Icon.vue'

const props = defineProps<{ text: string }>()

const router = useRouter()
const { currentTravelId } = useCurrentTravel()

const blocks = computed(() => parseNoteBlocks(props.text))

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
  <div class="note-text">
    <template v-for="(block, bIdx) in blocks" :key="bIdx">
      <p v-if="block.type === 'paragraph'" class="note-p">
        <template v-for="(line, lIdx) in block.lines" :key="lIdx">
          <br v-if="lIdx > 0" />
          <template v-for="(seg, sIdx) in line" :key="sIdx">
            <template v-if="seg.type === 'text'">{{ seg.value }}</template>
            <strong v-else-if="seg.type === 'bold'">{{ seg.value }}</strong>
            <em v-else-if="seg.type === 'italic'">{{ seg.value }}</em>
            <code v-else-if="seg.type === 'code'" class="note-code">{{ seg.value }}</code>
            <a v-else-if="seg.type === 'link'" :href="seg.href" target="_blank" rel="noopener noreferrer" class="note-link">
              <Icon name="link" :size="12" class="note-link-icon" />
              <span class="note-link-text">{{ seg.text }}</span>
            </a>
            <button v-else-if="seg.type === 'quicklink'" type="button" class="qlink-chip" @click.stop="go(seg.target, seg.category)">
              <Icon :name="TARGET_ICON[seg.target]" :size="12" class="qlink-icon" />
              <span class="qlink-section">{{ QUICK_LINK_LABELS[seg.target] }}</span>
              <span class="qlink-category">{{ seg.category }}</span>
            </button>
          </template>
        </template>
      </p>
      <component :is="block.ordered ? 'ol' : 'ul'" v-else class="note-list">
        <li v-for="(item, iIdx) in block.items" :key="iIdx">
          <template v-for="(seg, sIdx) in item" :key="sIdx">
            <template v-if="seg.type === 'text'">{{ seg.value }}</template>
            <strong v-else-if="seg.type === 'bold'">{{ seg.value }}</strong>
            <em v-else-if="seg.type === 'italic'">{{ seg.value }}</em>
            <code v-else-if="seg.type === 'code'" class="note-code">{{ seg.value }}</code>
            <a v-else-if="seg.type === 'link'" :href="seg.href" target="_blank" rel="noopener noreferrer" class="note-link">
              <Icon name="link" :size="12" class="note-link-icon" />
              <span class="note-link-text">{{ seg.text }}</span>
            </a>
            <button v-else-if="seg.type === 'quicklink'" type="button" class="qlink-chip" @click.stop="go(seg.target, seg.category)">
              <Icon :name="TARGET_ICON[seg.target]" :size="12" class="qlink-icon" />
              <span class="qlink-section">{{ QUICK_LINK_LABELS[seg.target] }}</span>
              <span class="qlink-category">{{ seg.category }}</span>
            </button>
          </template>
        </li>
      </component>
    </template>
  </div>
</template>

<style scoped>
.note-p {
  margin: 0;
}
.note-p + .note-p,
.note-list + .note-p,
.note-p + .note-list,
.note-list + .note-list {
  margin-top: 4px;
}
.note-list {
  margin: 0;
  padding-left: 1.2em;
}
.note-list li + li {
  margin-top: 2px;
}
.note-code {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--paper-dark);
  color: var(--ink);
  padding: 1px 5px;
  border-radius: 4px;
}
.note-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 2px;
  padding: 3px 9px 3px 7px;
  border: 1px solid rgba(169, 121, 44, 0.32);
  border-radius: 999px;
  background: rgba(169, 121, 44, 0.08);
  color: var(--brass);
  text-decoration: none;
  vertical-align: -3px;
}
.note-link-icon {
  color: var(--brass);
  flex-shrink: 0;
}
.note-link-text {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
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
  font-size: 9.5px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
</style>
