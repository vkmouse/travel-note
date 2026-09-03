import { ref, computed, watch, type Ref } from 'vue'
import { useItinerary } from './useItinerary'
import { useDocuments } from './useDocuments'
import { useInfo } from './useInfo'
import { resolvePlaceFromMapUrl, buildDirectionsUrl } from '../utils/googleMaps'

interface RoutableItem {
  id: string
  mapUrl: string
}

// 狀態放在模組層級（不屬於任何一個元件），這樣切換每日行程／旅行文件／常用資訊／行前清單
// 這四個分頁時（AppShell 本來就不會重新掛載）都共用同一份「規劃路線」開關與勾選順序。
const planningRoute = ref(false)
const selectionOrder = ref<string[]>([])
const routeUrl = ref<string | null>(null)

export function useRoutePlanning(travelId: Ref<string | null>) {
  const { items: itineraryItems } = useItinerary(travelId)
  const { items: documentItems } = useDocuments(travelId)
  const { items: infoItems } = useInfo(travelId)

  // id 前面加來源前綴避免三張表的 id 混淆；固定排序（行程按日期時間、文件/資訊按各自 order）
  // 只用在「全選」，使用者手動一個個點的話是照點擊順序來，跟這裡的排序無關
  const routableItems = computed<RoutableItem[]>(() => {
    const itinerary = [...itineraryItems.value]
      .filter((it) => it.map_url)
      .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
      .map((it) => ({ id: `itinerary:${it.id}`, mapUrl: it.map_url! }))
    const documents = [...documentItems.value]
      .filter((d) => d.map_url)
      .sort((a, b) => a.order - b.order)
      .map((d) => ({ id: `documents:${d.id}`, mapUrl: d.map_url! }))
    const info = [...infoItems.value]
      .filter((i) => i.map_url)
      .sort((a, b) => a.order - b.order)
      .map((i) => ({ id: `info:${i.id}`, mapUrl: i.map_url! }))
    return [...itinerary, ...documents, ...info]
  })

  const selectedIdSet = computed(() => new Set(selectionOrder.value))

  function isSelected(id: string) {
    return selectedIdSet.value.has(id)
  }
  function selectionNumber(id: string) {
    const idx = selectionOrder.value.indexOf(id)
    return idx === -1 ? null : idx + 1
  }
  function toggle(id: string) {
    selectionOrder.value = isSelected(id)
      ? selectionOrder.value.filter((x) => x !== id)
      : [...selectionOrder.value, id]
  }
  function startPlanning() {
    // 預設不勾選任何項目，讓使用者自己選（或用「全選」）
    selectionOrder.value = []
    planningRoute.value = true
  }
  // 「全選」只作用在呼叫端傳進來、當下實際看得到的那批 id
  // （例如行程頁的「這一天」、文件／資訊頁的「這個分類」），
  // 不是整頁全部、也不影響其他天／其他分類已經勾選的項目
  function toggleSelectAllForIds(ids: string[]) {
    if (ids.length === 0) return
    const allOn = ids.every((id) => selectedIdSet.value.has(id))
    if (allOn) {
      const idSet = new Set(ids)
      selectionOrder.value = selectionOrder.value.filter((id) => !idSet.has(id))
    } else {
      const toAdd = ids.filter((id) => !selectedIdSet.value.has(id))
      selectionOrder.value = [...selectionOrder.value, ...toAdd]
    }
  }
  function closePlanning() {
    planningRoute.value = false
    selectionOrder.value = []
  }

  // 依勾選順序解析地點串路線；order 用參照比對，若解析途中勾選又變了就捨棄這次的過期結果
  watch(
    selectionOrder,
    async (order) => {
      if (order.length < 2) { routeUrl.value = null; return }
      const urlById = new Map(routableItems.value.map((it) => [it.id, it.mapUrl]))
      const mapUrls = order.map((id) => urlById.get(id)).filter((u): u is string => !!u)
      const places = (await Promise.all(mapUrls.map(resolvePlaceFromMapUrl))).filter((p): p is string => !!p)
      if (selectionOrder.value !== order) return
      routeUrl.value = places.length >= 2 ? buildDirectionsUrl(places) : null
    },
    { immediate: true },
  )

  return {
    planningRoute,
    routableItems,
    selectedCount: computed(() => selectionOrder.value.length),
    routeUrl,
    isSelected,
    selectionNumber,
    toggle,
    startPlanning,
    toggleSelectAllForIds,
    closePlanning,
  }
}
