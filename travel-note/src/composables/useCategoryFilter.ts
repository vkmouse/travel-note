import { computed, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'

// 分類點過來的網址帶 query.category，要能覆蓋目前選取的分類（見 QuickLinkText 的用途）
export function useCategoryFilter<T>(items: Ref<T[]>, categoryOf: (item: T) => string) {
  const route = useRoute()
  const queryCategory = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))

  const categories = computed(() => {
    const set = new Set(items.value.map(categoryOf))
    if (queryCategory.value) set.add(queryCategory.value)
    return ['全部', ...set]
  })

  const activeCategory = ref(queryCategory.value || '全部')
  watch(queryCategory, (c) => { if (c) activeCategory.value = c })

  const filtered = computed(() =>
    items.value.filter((i) => activeCategory.value === '全部' || categoryOf(i) === activeCategory.value),
  )

  const grouped = computed(() => {
    const cats = [...new Set(filtered.value.map(categoryOf))]
    return cats.map((cat) => ({ category: cat, rows: filtered.value.filter((i) => categoryOf(i) === cat) }))
  })

  return { categories, activeCategory, filtered, grouped }
}
