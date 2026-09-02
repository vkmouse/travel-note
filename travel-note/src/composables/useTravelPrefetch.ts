import { useQueryClient } from '@tanstack/vue-query'
import { fetchItinerary, fetchDocuments, fetchInfo, fetchChecklist } from '../services/api'

// key 必須跟 useItinerary / useDocuments / useInfo / useChecklist 的 queryKey 完全一致，
// 才能共用同一份快取，讓使用者切到分頁時直接吃到已經 prefetch 好的資料
const TARGETS = [
  { key: 'itinerary', fetch: fetchItinerary },
  { key: 'documents', fetch: fetchDocuments },
  { key: 'info', fetch: fetchInfo },
  { key: 'checklist', fetch: fetchChecklist },
] as const

export function useTravelPrefetch() {
  const queryClient = useQueryClient()

  async function prefetchAll(travelId: string) {
    await Promise.allSettled(
      TARGETS.map(({ key, fetch }) => {
        const queryKey = [key, travelId]
        if (queryClient.getQueryData(queryKey)) return Promise.resolve()
        return queryClient.prefetchQuery({ queryKey, queryFn: () => fetch(travelId) })
      }),
    )
  }

  return { prefetchAll }
}
