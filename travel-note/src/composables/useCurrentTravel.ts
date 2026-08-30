import { computed, ref } from 'vue'

// 不做持久化：每次重新整理頁面都會回到旅行選擇畫面（module-level ref，重新載入頁面即重置）
const currentTravelId = ref<string | null>(null)

export function useCurrentTravel() {
  function selectTravel(id: string) {
    currentTravelId.value = id
  }
  function clearTravel() {
    currentTravelId.value = null
  }

  return {
    currentTravelId: computed(() => currentTravelId.value),
    selectTravel,
    clearTravel,
  }
}
