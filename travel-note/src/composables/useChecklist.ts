import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchChecklist } from '../services/api'

export function useChecklist() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['checklist'],
    queryFn: fetchChecklist,
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
    queryClient.invalidateQueries({ queryKey: ['checklist'] })
  }

  return { items, loading, error, refresh }
}
