import type { Env, TravelAuthContext } from '../../../../types'
import { jsonError, jsonOk } from '../../../../lib/response'
import { DOCUMENT_CATEGORIES, isValidCategory, normalizeDocumentCategory } from '../../../../lib/enums'

export const onRequestPut: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM documents WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆文件', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? normalizeDocumentCategory(existing.category))
    const title = String(body.title ?? existing.title)
    if (!category || !title) return jsonError('category 與 title 為必填', 400)
    if (!isValidCategory(category, DOCUMENT_CATEGORIES)) return jsonError(`category 必須是：${DOCUMENT_CATEGORIES.join('、')}`, 400)

    const date_start = String(body.date_start ?? existing.date_start ?? '')
    const date_end = String(body.date_end ?? existing.date_end ?? '')
    const map_url = String(body.map_url ?? existing.map_url ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(
      `UPDATE documents SET category = ?, title = ?, date_start = ?, date_end = ?, map_url = ?, note = ? WHERE id = ? AND travel_id = ?`,
    )
      .bind(category, title, date_start, date_end, map_url, note, id, travelId)
      .run()

    return jsonOk({ id, order: existing.order, category, title, date_start, date_end, map_url, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

// 拖曳排序用：只改 order，不動其他欄位。前端只在同一個分類篩選範圍內重新分配 order 值，
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
    const existing = await DB.prepare(`SELECT * FROM documents WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆文件', 404)

    await DB.prepare(`UPDATE documents SET "order" = ? WHERE id = ? AND travel_id = ?`)
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
    await DB.prepare(`DELETE FROM documents WHERE id = ? AND travel_id = ?`).bind(id, travelId).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
