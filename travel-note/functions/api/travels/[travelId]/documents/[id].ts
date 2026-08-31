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
    const link = String(body.link ?? existing.link ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(
      `UPDATE documents SET category = ?, title = ?, date_start = ?, date_end = ?, link = ?, note = ? WHERE id = ? AND travel_id = ?`,
    )
      .bind(category, title, date_start, date_end, link, note, id, travelId)
      .run()

    return jsonOk({ id, order: existing.order, category, title, date_start, date_end, link, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
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
