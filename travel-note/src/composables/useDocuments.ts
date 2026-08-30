import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchDocuments } from '../services/api'

export function useDocuments(travelId: MaybeRefOrGetter<string | null>) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: computed(() => ['documents', toValue(travelId)]),
    queryFn: () => fetchDocuments(toValue(travelId) as string),
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
    queryClient.invalidateQueries({ queryKey: ['documents', toValue(travelId)] })
  }

  return { items, loading, error, refresh }
}
