import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchTravels } from '../services/api'

export function useTravels() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['travels'],
    queryFn: fetchTravels,
    retry: 1,
  })

  const travels = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => {
    const err = query.error.value
    if (!err) return null
    return err instanceof Error ? err.message : String(err)
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['travels'] })
  }

  return { travels, loading, error, refresh }
}
