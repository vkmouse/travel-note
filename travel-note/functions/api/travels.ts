import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    // 清單要同時列出自己擁有的旅行，以及被邀請且已接受的旅行，用 is_owner 讓前端分辨
    const { results } = await DB.prepare(
      `SELECT id, title, date_start, date_end, "order", created_at, 1 AS is_owner
       FROM travels WHERE user_id = ?
       UNION
       SELECT t.id, t.title, t.date_start, t.date_end, t."order", t.created_at, 0 AS is_owner
       FROM travels t
       JOIN travel_members m ON m.travel_id = t.id
       WHERE m.user_id = ? AND m.status = 'accepted'
       ORDER BY "order" ASC`,
    ).bind(userId, userId).all()

    return jsonOk((results ?? []).map((row: Record<string, unknown>) => ({ ...row, is_owner: Boolean(row.is_owner) })))
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const title = String(body.title ?? '').trim()
    if (!title) return jsonError('title 為必填', 400)

    const date_start = String(body.date_start ?? '')
    const date_end = String(body.date_end ?? '')

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM travels WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `trip_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO travels (id, user_id, title, date_start, date_end, "order")
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, userId, title, date_start, date_end, order)
      .run()

    return jsonOk({ id, title, date_start, date_end, order })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
