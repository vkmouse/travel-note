import type { AuthContext, Env } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const id = context.params.id as string

  try {
    const invitation = await DB.prepare(`SELECT user_id, status FROM travel_members WHERE id = ?`)
      .bind(id)
      .first<{ user_id: string; status: string }>()
    if (!invitation || invitation.user_id !== userId) return jsonError('找不到這筆邀請', 404)
    if (invitation.status !== 'pending') return jsonError('這筆邀請已經處理過了', 409)

    await DB.prepare(`UPDATE travel_members SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(id)
      .run()

    return jsonOk({ id, status: 'accepted' })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'accept failed', 500)
  }
}
