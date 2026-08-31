import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'

export const onRequestGet: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId

  try {
    const owner = await DB.prepare(
      `SELECT u.id AS user_id, u.email FROM travels t JOIN users u ON u.id = t.user_id WHERE t.id = ?`,
    ).bind(travelId).first<{ user_id: string; email: string }>()

    const { results } = await DB.prepare(
      `SELECT u.id AS user_id, u.email, m.status, m.invited_at, m.accepted_at
       FROM travel_members m JOIN users u ON u.id = m.user_id
       WHERE m.travel_id = ?
       ORDER BY m.invited_at ASC`,
    ).bind(travelId).all()

    return jsonOk({ owner, members: results ?? [] })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}
