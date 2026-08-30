import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchInfo } from '../services/api'

export function useInfo(travelId: MaybeRefOrGetter<string | null>) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: computed(() => ['info', toValue(travelId)]),
    queryFn: () => fetchInfo(toValue(travelId) as string),
    enabled: computed(() => !!toValue(travelId)),
    retry: 1,
  })

  const items = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => {
    const err = query.error.value
    if (!err) return null
    return err instanceof Error ? err.message : String(err)
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['info', toValue(travelId)] })
  }

  return { items, loading, error, refresh }
}
