import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

// 列出「我」在所有旅行裡還沒處理的邀請
export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const { results } = await DB.prepare(
      `SELECT m.id, m.travel_id, t.title AS travel_title, m.invited_by, u.email AS invited_by_email, m.invited_at
       FROM travel_members m
       JOIN travels t ON t.id = m.travel_id
       JOIN users u ON u.id = m.invited_by
       WHERE m.user_id = ? AND m.status = 'pending'
       ORDER BY m.invited_at DESC`,
    ).bind(userId).all()

    return jsonOk(results ?? [])
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}
