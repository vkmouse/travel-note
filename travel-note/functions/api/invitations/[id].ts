import type { AuthContext, Env } from '../../types'
import { jsonError, jsonOk } from '../../lib/response'

// 刪除同一筆邀請：被邀請者用來拒絕，擁有者用來收回，共用同一個動作
export const onRequestDelete: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const id = context.params.id as string

  try {
    const invitation = await DB.prepare(
      `SELECT m.user_id, t.user_id AS owner_id
       FROM travel_members m JOIN travels t ON t.id = m.travel_id
       WHERE m.id = ?`,
    ).bind(id).first<{ user_id: string; owner_id: string }>()
    if (!invitation) return jsonError('找不到這筆邀請', 404)
    if (invitation.user_id !== userId && invitation.owner_id !== userId) return jsonError('沒有權限操作這筆邀請', 403)

    await DB.prepare(`DELETE FROM travel_members WHERE id = ?`).bind(id).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
