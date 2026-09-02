<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'
import { useMyInvitations } from '../composables/useMyInvitations'
import { useTravels } from '../composables/useTravels'
import { acceptInvitation, declineInvitation } from '../services/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { invitations, loading, error, refresh } = useMyInvitations()
const { refresh: refreshTravels } = useTravels()

const busyId = ref<string | null>(null)
const actionError = ref('')

watch(() => props.open, (open) => { if (open) { actionError.value = ''; refresh() } })

async function accept(id: string) {
  busyId.value = id
  actionError.value = ''
  try {
    await acceptInvitation(id)
    refresh()
    refreshTravels()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busyId.value = null
  }
}

// 拒絕邀請代價低（擁有者可以重新邀請），不用二次確認
async function decline(id: string) {
  busyId.value = id
  actionError.value = ''
  try {
    await declineInvitation(id)
    refresh()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="我的邀請">
      <div class="drawer-top">
        <div class="drawer-handle"></div>
      </div>
      <div class="drawer-body">
        <h3 class="drawer-title">我的邀請</h3>

        <p v-if="loading" class="state-msg">載入中...</p>
        <p v-else-if="error" class="state-msg error">{{ error }}</p>
        <template v-else-if="invitations.length">
          <div v-for="inv in invitations" :key="inv.id" class="invite-item">
            <div class="invite-icon"><Icon name="suitcase" :size="16" /></div>
            <div class="invite-body">
              <p class="invite-title">{{ inv.travel_title }}</p>
              <p class="invite-sub">{{ inv.invited_by_email }} 邀請你</p>
            </div>
            <div class="invite-actions">
              <button class="btn-decline" type="button" :disabled="busyId === inv.id" @click="decline(inv.id)">拒絕</button>
              <button class="btn-accept" type="button" :disabled="busyId === inv.id" @click="accept(inv.id)">
                <Icon name="check" :size="14" :stroke-width="2.4" />接受
              </button>
            </div>
          </div>
        </template>
        <div v-else class="empty"><p>目前沒有待處理的邀請</p></div>
        <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 82vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-top { flex-shrink: 0; }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px calc(20px + var(--safe-bottom)); }
.drawer-title { margin: 0 0 14px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }

.invite-item { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-top: 1px solid var(--line); }
.invite-item:first-of-type { border-top: 0; }
.invite-icon { width: 34px; height: 34px; flex-shrink: 0; border-radius: 9px; background: var(--paper); color: var(--brass); display: flex; align-items: center; justify-content: center; }
.invite-body { flex: 1; min-width: 0; }
.invite-title { margin: 0; font-weight: 600; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.invite-sub { margin: 2px 0 0; font-size: 11.5px; color: var(--muted); }
.invite-actions { display: flex; gap: 6px; flex-shrink: 0; }
.invite-actions button { min-height: 36px; border: 0; border-radius: 9px; font-weight: 600; font-size: 12.5px; padding: 0 11px; display: flex; align-items: center; gap: 4px; }
.btn-decline { background: var(--paper); color: var(--ink); }
.btn-accept { background: var(--brass); color: #fff; }
.invite-actions button:disabled { opacity: .55; cursor: wait; }
</style>
