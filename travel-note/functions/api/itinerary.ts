import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const { results } = await DB.prepare(
      `SELECT id, "order", date, time, title, location, map_url, note
       FROM itinerary
       ORDER BY date ASC, "order" ASC`,
    ).all()

    return jsonOk(results ?? [])
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const date = String(body.date ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!date || !title) return jsonError('date 與 title 為必填', 400)

    const time = String(body.time ?? '')
    const location = String(body.location ?? '')
    const map_url = String(body.map_url ?? '')
    const note = String(body.note ?? '')

    // order 只在同一天內排序，所以用該天現有的最大值 +1，而不是整張表的筆數
    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM itinerary WHERE date = ?`,
    )
      .bind(date)
      .all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `it_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO itinerary (id, "order", date, time, title, location, map_url, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, order, date, time, title, location, map_url, note)
      .run()

    return jsonOk({ id, order, date, time, title, location, map_url, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
