import { useQueryClient } from '@tanstack/vue-query'
import { fetchItinerary, fetchDocuments, fetchInfo, fetchChecklist } from '../services/api'

export function useTravelPrefetch() {
  const queryClient = useQueryClient()

  // key 必須跟各自 composable 的 queryKey 完全一致才能共用快取；
  // 拆成獨立呼叫（而非陣列 map）是為了讓 TS 對每支的回傳型別各自推斷，不互相污染
  function prefetchOne<T>(key: string, travelId: string, fetch: (id: string) => Promise<T>) {
    const queryKey = [key, travelId]
    if (queryClient.getQueryData(queryKey)) return Promise.resolve()
    return queryClient.prefetchQuery({ queryKey, queryFn: () => fetch(travelId) })
  }

  async function prefetchAll(travelId: string) {
    // allSettled：四支各自獨立，其中一支失敗不能擋到其他三支先顯示出來
    await Promise.allSettled([
      prefetchOne('itinerary', travelId, fetchItinerary),
      prefetchOne('documents', travelId, fetchDocuments),
      prefetchOne('info', travelId, fetchInfo),
      prefetchOne('checklist', travelId, fetchChecklist),
    ])
  }

  return { prefetchAll }
}
