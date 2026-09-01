import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 目前旅行的狀態改由網址（/travels/:travelId/...）承載，
// 這樣重新整理頁面、分享連結都能保留原本選的旅行。
export function useCurrentTravel() {
  const route = useRoute()
  const router = useRouter()

  const currentTravelId = computed(() => (route.params.travelId as string | undefined) ?? null)

  function selectTravel(id: string) {
    router.push({ name: 'itinerary', params: { travelId: id } })
  }

  function clearTravel() {
    router.push({ name: 'picker' })
  }

  return {
    currentTravelId,
    selectTravel,
    clearTravel,
  }
}
