import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'

export const onRequestGet: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId

  try {
    const { results } = await DB.prepare(
      `SELECT id, "order", date, time, title, location, map_url, note
       FROM itinerary WHERE travel_id = ? AND user_id = ?
       ORDER BY date ASC, "order" ASC`,
    ).bind(travelId, userId).all()

    return jsonOk(results ?? [])
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const date = String(body.date ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!date || !title) return jsonError('date 與 title 為必填', 400)

    const time = String(body.time ?? '')
    const location = String(body.location ?? '')
    const map_url = String(body.map_url ?? '')
    const note = String(body.note ?? '')

    // order 只在同一趟旅行、同一天內排序，所以用該 travel 該天現有的最大值 +1
    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM itinerary WHERE travel_id = ? AND date = ?`,
    )
      .bind(travelId, date)
      .all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `it_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO itinerary (id, travel_id, user_id, "order", date, time, title, location, map_url, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, travelId, userId, order, date, time, title, location, map_url, note)
      .run()

    return jsonOk({ id, order, date, time, title, location, map_url, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
