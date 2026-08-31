<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'
import DrawerConfirm from './DrawerConfirm.vue'
import { fetchTravelMembers, inviteMember, declineInvitation } from '../services/api'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { TravelMembers } from '../types'

const props = defineProps<{ open: boolean; travelId: string | null; isOwner: boolean }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const { currentEmail } = useCurrentUser()

const data = ref<TravelMembers | null>(null)
const loading = ref(false)
const loadError = ref('')

const inviteEmail = ref('')
const inviteBusy = ref(false)
const inviteError = ref('')

// 移除成員 / 離開旅行需要二次確認，收回待接受邀請不用（對方還沒加入，代價很低）
const confirmOpen = ref(false)
const confirmTarget = ref<{ id: string; email: string } | null>(null)
const confirmBusy = ref(false)
const rowBusyId = ref<string | null>(null)
const actionError = ref('')

async function load() {
  if (!props.travelId) return
  loading.value = true
  loadError.value = ''
  try {
    data.value = await fetchTravelMembers(props.travelId)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (open) => {
  if (open) {
    inviteEmail.value = ''
    inviteError.value = ''
    actionError.value = ''
    load()
  }
})

async function submitInvite() {
  const email = inviteEmail.value.trim()
  if (!email) { inviteError.value = '請輸入 email'; return }
  inviteBusy.value = true
  inviteError.value = ''
  try {
    await inviteMember(props.travelId as string, email)
    inviteEmail.value = ''
    await load()
    emit('changed')
  } catch (e) {
    inviteError.value = e instanceof Error ? e.message : String(e)
  } finally {
    inviteBusy.value = false
  }
}

// 收回待接受邀請：直接執行，不用二次確認
async function revokePending(id: string) {
  rowBusyId.value = id
  actionError.value = ''
  try {
    await declineInvitation(id)
    await load()
    emit('changed')
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    rowBusyId.value = null
  }
}

function openConfirm(id: string, email: string) {
  confirmTarget.value = { id, email }
  actionError.value = ''
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!confirmTarget.value) return
  confirmBusy.value = true
  try {
    await declineInvitation(confirmTarget.value.id)
    confirmOpen.value = false
    await load()
    emit('changed')
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    confirmBusy.value = false
  }
}
</script>

<template>
  <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
    <section class="drawer-sheet" role="dialog" aria-modal="true" aria-label="成員與邀請">
      <div class="drawer-top">
        <div class="drawer-perf"></div>
        <div class="drawer-handle"></div>
      </div>
      <div class="drawer-body">
        <h3 class="drawer-title">成員與邀請</h3>

        <template v-if="isOwner">
          <div class="invite-row">
            <input v-model="inviteEmail" type="email" class="f-input" placeholder="輸入 email 邀請共享者" @keyup.enter="submitInvite" />
            <button class="invite-btn" type="button" :disabled="inviteBusy" @click="submitInvite">
              <Icon name="userplus" :size="15" />{{ inviteBusy ? '邀請中…' : '邀請' }}
            </button>
          </div>
          <p v-if="inviteError" class="drawer-error">{{ inviteError }}</p>
          <p class="members-hint">對方需先以本 App 登入過一次，才能輸入 email 邀請。邀請不會寄送 email，請自行告知對方到「我的邀請」查看。</p>
        </template>
        <p v-else class="members-hint">只有擁有者可以邀請新成員。</p>

        <p v-if="loading" class="state-msg">載入中...</p>
        <p v-else-if="loadError" class="state-msg error">{{ loadError }}</p>
        <template v-else-if="data">
          <div class="member-row">
            <div class="member-icon"><Icon name="users" :size="16" /></div>
            <div class="member-body">
              <p class="member-email">{{ data.owner.email }}</p>
            </div>
            <span class="member-tag">擁有者</span>
          </div>

          <div v-for="m in data.members.filter((x) => x.status === 'accepted')" :key="m.id" class="member-row">
            <div class="member-icon"><Icon name="users" :size="16" /></div>
            <div class="member-body">
              <p class="member-email">{{ m.email }}</p>
            </div>
            <button
              v-if="isOwner"
              class="icon-btn danger"
              aria-label="移除成員"
              :disabled="rowBusyId === m.id"
              @click="openConfirm(m.id, m.email)"
            ><Icon name="trash" :size="16" /></button>
            <button
              v-else-if="m.email === currentEmail"
              class="icon-btn danger"
              aria-label="離開這趟旅行"
              :disabled="rowBusyId === m.id"
              @click="openConfirm(m.id, m.email)"
            ><Icon name="doorexit" :size="16" /></button>
          </div>

          <div v-for="m in data.members.filter((x) => x.status === 'pending')" :key="m.id" class="member-row pending">
            <div class="member-icon pending"><Icon name="mail" :size="15" /></div>
            <div class="member-body">
              <p class="member-email">{{ m.email }}</p>
              <p class="member-status">待接受</p>
            </div>
            <button
              v-if="isOwner"
              class="icon-btn"
              aria-label="收回邀請"
              :disabled="rowBusyId === m.id"
              @click="revokePending(m.id)"
            ><Icon name="close" :size="15" /></button>
          </div>

          <p v-if="!data.members.length" class="empty">目前還沒有其他成員</p>
        </template>
        <p v-if="actionError" class="state-msg error">{{ actionError }}</p>
      </div>
    </section>

    <DrawerConfirm
      :open="confirmOpen"
      :title="isOwner ? `移除「${confirmTarget?.email ?? ''}」` : '離開這趟旅行'"
      :busy="confirmBusy"
      @cancel="confirmOpen = false"
      @confirm="confirmRemove"
    />
  </div>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(22,34,58,.55); }
.drawer-sheet { width: 100%; max-width: 480px; max-height: 82vh; overflow: hidden; display: flex; flex-direction: column; background: var(--card); border-radius: 18px 18px 0 0; }
.drawer-top { flex-shrink: 0; }
.drawer-perf { height: 12px; background-image: radial-gradient(circle 5px, var(--paper) 5px, transparent 5.5px); background-size: 22px 100%; background-position: 11px 6px; background-repeat: repeat-x; border-bottom: 1px dashed var(--line); }
.drawer-handle { width: 36px; height: 4px; margin: 10px auto 2px; border-radius: 99px; background: var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px calc(20px + var(--safe-bottom)); }
.drawer-title { margin: 0 0 14px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }

.invite-row { display: flex; gap: 8px; }
.f-input { flex: 1; padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); font: 14px 'Inter', sans-serif; }
.invite-btn { display: flex; align-items: center; gap: 5px; white-space: nowrap; padding: 0 14px; border: 0; border-radius: 10px; background: var(--brass); color: #fff; font-weight: 600; font-size: 13.5px; }
.invite-btn:disabled { opacity: .55; cursor: wait; }
.drawer-error { margin: 8px 0 0; color: var(--danger); font-size: 13px; }
.members-hint { margin: 10px 0 16px; color: var(--muted); font-size: 12px; line-height: 1.5; }

.member-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--line); }
.member-row:first-of-type { border-top: 0; }
.member-icon { width: 34px; height: 34px; flex-shrink: 0; border-radius: 9px; background: var(--paper); color: var(--brass); display: flex; align-items: center; justify-content: center; }
.member-icon.pending { color: var(--muted); border: 1px dashed var(--line); background: none; }
.member-body { flex: 1; min-width: 0; }
.member-email { margin: 0; font-weight: 600; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-status { margin: 2px 0 0; font-size: 11px; color: var(--brass); }
.member-tag { flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--brass); background: var(--paper); padding: 3px 9px; border-radius: 999px; }
</style>
