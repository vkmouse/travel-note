import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchDocuments } from '../services/api'

export function useDocuments() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
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
    queryClient.invalidateQueries({ queryKey: ['documents'] })
  }

  return { items, loading, error, refresh }
}
