import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchItinerary } from '../services/api'

export function useItinerary() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['itinerary'],
    queryFn: fetchItinerary,
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
    queryClient.invalidateQueries({ queryKey: ['itinerary'] })
  }

  return { items, loading, error, refresh }
}
