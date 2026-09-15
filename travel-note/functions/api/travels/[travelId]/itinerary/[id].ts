import type { Env, TravelAuthContext } from '../../../../types'
import { jsonError, jsonOk } from '../../../../lib/response'

export const onRequestPut: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM itinerary WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆行程', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const date = String(body.date ?? existing.date)
    const title = String(body.title ?? existing.title)
    if (!date || !title) return jsonError('date 與 title 為必填', 400)

    const time = String(body.time ?? existing.time ?? '')
    const map_url = String(body.map_url ?? existing.map_url ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(
      `UPDATE itinerary SET date = ?, time = ?, title = ?, map_url = ?, note = ? WHERE id = ? AND travel_id = ?`,
    )
      .bind(date, time, title, map_url, note, id, travelId)
      .run()

    return jsonOk({ id, order: existing.order, date, time, title, map_url, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

// 拖曳排序用：只改 order，不動其他欄位。前端只在同一天的範圍內重新分配 order 值，
// 所以這裡單純信任傳進來的數字，不用重新計算其他項目的 order。
export const onRequestPatch: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const body = await context.request.json<Record<string, unknown>>()
    if (typeof body.order !== 'number' || !Number.isFinite(body.order)) {
      return jsonError('order 必須是數字', 400)
    }
    const existing = await DB.prepare(`SELECT * FROM itinerary WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆行程', 404)

    await DB.prepare(`UPDATE itinerary SET "order" = ? WHERE id = ? AND travel_id = ?`)
      .bind(body.order, id, travelId)
      .run()

    return jsonOk({ ...existing, order: body.order })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'patch failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    await DB.prepare(`DELETE FROM itinerary WHERE id = ? AND travel_id = ?`).bind(id, travelId).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
