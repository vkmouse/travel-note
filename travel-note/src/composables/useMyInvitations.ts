import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchMyInvitations } from '../services/api'

export function useMyInvitations() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['my-invitations'],
    queryFn: fetchMyInvitations,
    retry: 1,
  })

  const invitations = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => {
    const err = query.error.value
    if (!err) return null
    return err instanceof Error ? err.message : String(err)
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
  }

  return { invitations, loading, error, refresh }
}
