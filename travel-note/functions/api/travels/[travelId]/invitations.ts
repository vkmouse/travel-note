import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'

export const onRequestPost: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId

  // 只有擁有者能發出邀請，共享者不行
  if (!context.data.isOwner) return jsonError('只有擁有者可以邀請共享者', 403)

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const email = String(body.email ?? '').trim()
    if (!email) return jsonError('email 為必填', 400)

    // 被邀請者必須已經用這個 app 登入過，否則系統裡查不到對應的使用者
    const invitee = await DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: string }>()
    if (!invitee) return jsonError('此使用者尚未使用過本 app，無法邀請', 404)
    if (invitee.id === userId) return jsonError('不能邀請自己', 400)

    const existing = await DB.prepare(`SELECT status FROM travel_members WHERE travel_id = ? AND user_id = ?`)
      .bind(travelId, invitee.id)
      .first<{ status: string }>()
    if (existing) return jsonError(existing.status === 'accepted' ? '此人已經是成員' : '已經邀請過此人', 409)

    const id = `mem_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO travel_members (id, travel_id, user_id, status, invited_by)
       VALUES (?, ?, ?, 'pending', ?)`,
    )
      .bind(id, travelId, invitee.id, userId)
      .run()

    return jsonOk({ id, travel_id: travelId, email, status: 'pending' })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'invite failed', 500)
  }
}
