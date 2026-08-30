<script setup lang="ts">
import { computed } from 'vue'
import { ICONS, ICONS_FILLED } from '../icons'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    filled?: boolean
    strokeWidth?: number
  }>(),
  {
    size: 18,
    filled: false,
    strokeWidth: 1.7,
  },
)

const markup = computed(() => {
  const source = props.filled ? ICONS_FILLED : ICONS
  return source[props.name] ?? ICONS[props.name] ?? ''
})
</script>

<template>
  <svg
    v-if="filled"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    v-html="markup"
  ></svg>
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="markup"
  ></svg>
</template>
