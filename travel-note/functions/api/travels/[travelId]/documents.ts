import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'
import { DOCUMENT_CATEGORIES, isValidCategory, normalizeDocumentCategory } from '../../../lib/enums'

export const onRequestGet: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const category = new URL(context.request.url).searchParams.get('category')

  try {
    // 存取權已在 middleware 檢查過，這裡不再用 user_id 縮小範圍，讓共享者互相看得到彼此的項目
    const stmt = category === '票券'
      ? DB.prepare(
          `SELECT id, "order", category, title, date_start, date_end, link, note
           FROM documents WHERE travel_id = ? AND category IN (?, ?, ?)
           ORDER BY "order" ASC`,
        ).bind(travelId, '票券', 'KKday', 'Klook')
      : category
        ? DB.prepare(
            `SELECT id, "order", category, title, date_start, date_end, link, note
             FROM documents WHERE travel_id = ? AND category = ?
             ORDER BY "order" ASC`,
          ).bind(travelId, category)
      : DB.prepare(
          `SELECT id, "order", category, title, date_start, date_end, link, note
           FROM documents WHERE travel_id = ?
           ORDER BY "order" ASC`,
        ).bind(travelId)

    const { results } = await stmt.all()
    return jsonOk((results ?? []).map((row) => ({ ...row, category: normalizeDocumentCategory(row.category) })))
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
    const category = String(body.category ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!category || !title) return jsonError('category 與 title 為必填', 400)
    if (!isValidCategory(category, DOCUMENT_CATEGORIES)) return jsonError(`category 必須是：${DOCUMENT_CATEGORIES.join('、')}`, 400)

    const date_start = String(body.date_start ?? '')
    const date_end = String(body.date_end ?? '')
    const link = String(body.link ?? '')
    const note = String(body.note ?? '')

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM documents WHERE travel_id = ?`,
    ).bind(travelId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `doc_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO documents (id, travel_id, user_id, "order", category, title, date_start, date_end, link, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, travelId, userId, order, category, title, date_start, date_end, link, note)
      .run()

    return jsonOk({ id, order, category, title, date_start, date_end, link, note })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
