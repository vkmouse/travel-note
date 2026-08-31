import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'

export const onRequestPut: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId

  try {
    // 存取權已經在 middleware 檢查過，這裡不再限定 user_id，讓共享者也能編輯
    const existing = await DB.prepare(`SELECT * FROM travels WHERE id = ?`)
      .bind(travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這趟旅行', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const title = String(body.title ?? existing.title)
    if (!title) return jsonError('title 為必填', 400)

    const date_start = String(body.date_start ?? existing.date_start ?? '')
    const date_end = String(body.date_end ?? existing.date_end ?? '')

    await DB.prepare(`UPDATE travels SET title = ?, date_start = ?, date_end = ? WHERE id = ?`)
      .bind(title, date_start, date_end, travelId)
      .run()

    return jsonOk({ id: travelId, title, date_start, date_end, order: existing.order })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId

  // 只有擁有者可以刪除整趟旅行，共享者不行
  if (!context.data.isOwner) return jsonError('只有擁有者可以刪除這趟旅行', 403)

  try {
    // 沒有用 FK cascade，刪除 travel 時手動把明細表與成員關係一起清掉
    await DB.batch([
      DB.prepare(`DELETE FROM itinerary WHERE travel_id = ?`).bind(travelId),
      DB.prepare(`DELETE FROM documents WHERE travel_id = ?`).bind(travelId),
      DB.prepare(`DELETE FROM info WHERE travel_id = ?`).bind(travelId),
      DB.prepare(`DELETE FROM checklist WHERE travel_id = ?`).bind(travelId),
      DB.prepare(`DELETE FROM travel_members WHERE travel_id = ?`).bind(travelId),
      DB.prepare(`DELETE FROM travels WHERE id = ?`).bind(travelId),
    ])

    return jsonOk({ id: travelId })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
