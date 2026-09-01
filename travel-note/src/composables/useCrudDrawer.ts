import { ref, type Ref } from 'vue'

// create/update 各自的 payload 型別跟著 documents/info/checklist 走，這裡不收窄，
// 沿用原本呼叫端 `values as never` 的做法，讓 DrawerForm 統一輸出的 Record<string,string> 可以直接餵進去
interface CrudApi {
  create: (travelId: string, values: never) => Promise<unknown>
  update: (travelId: string, id: string, values: never) => Promise<unknown>
  remove: (travelId: string, id: string) => Promise<unknown>
}

export function useCrudDrawer(currentTravelId: Ref<string | null>, api: CrudApi, refresh: () => unknown) {
  const formOpen = ref(false)
  const deleteOpen = ref(false)
  const editingId = ref<string | null>(null)
  const deletingId = ref<string | null>(null)
  const busy = ref(false)
  const actionError = ref('')

  function openCreate() { editingId.value = null; actionError.value = ''; formOpen.value = true }
  function openEdit(id: string) { editingId.value = id; actionError.value = ''; formOpen.value = true }
  function openDelete(id: string) { deletingId.value = id; actionError.value = ''; deleteOpen.value = true }

  async function save(values: Record<string, string>) {
    if (!currentTravelId.value) return
    busy.value = true
    try {
      if (editingId.value) await api.update(currentTravelId.value, editingId.value, values as never)
      else await api.create(currentTravelId.value, values as never)
      formOpen.value = false
      await refresh()
    } catch (e) {
      actionError.value = e instanceof Error ? e.message : String(e)
    } finally {
      busy.value = false
    }
  }

  async function confirmDelete() {
    if (!deletingId.value || !currentTravelId.value) return
    busy.value = true
    try {
      await api.remove(currentTravelId.value, deletingId.value)
      deleteOpen.value = false
      await refresh()
    } catch (e) {
      actionError.value = e instanceof Error ? e.message : String(e)
    } finally {
      busy.value = false
    }
  }

  return { formOpen, deleteOpen, editingId, deletingId, busy, actionError, openCreate, openEdit, openDelete, save, confirmDelete }
}
