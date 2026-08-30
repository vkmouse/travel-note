import type { Env } from '../../types'
import { jsonError, jsonOk } from '../../lib/response'

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM itinerary WHERE id = ?`).bind(id).first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆行程', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const date = String(body.date ?? existing.date)
    const title = String(body.title ?? existing.title)
    if (!date || !title) return jsonError('date 與 title 為必填', 400)

    const time = String(body.time ?? existing.time ?? '')
    const location = String(body.location ?? existing.location ?? '')
    const map_url = String(body.map_url ?? existing.map_url ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(
      `UPDATE itinerary SET date = ?, time = ?, title = ?, location = ?, map_url = ?, note = ? WHERE id = ?`,
    )
      .bind(date, time, title, location, map_url, note, id)
      .run()

    return jsonOk({ id, order: existing.order, date, time, title, location, map_url, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const id = context.params.id as string

  try {
    await DB.prepare(`DELETE FROM itinerary WHERE id = ?`).bind(id).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
