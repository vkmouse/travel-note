import type { Env, TravelAuthContext } from '../../../../types'
import { jsonError, jsonOk } from '../../../../lib/response'
import { CHECKLIST_CATEGORIES, isValidCategory } from '../../../../lib/enums'

export const onRequestPut: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM checklist WHERE id = ? AND travel_id = ? AND user_id = ?`)
      .bind(id, travelId, userId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆清單項目', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? existing.category)
    const title = String(body.title ?? existing.title)
    if (!category || !title) return jsonError('category 與 title 為必填', 400)
    if (!isValidCategory(category, CHECKLIST_CATEGORIES)) return jsonError(`category 必須是：${CHECKLIST_CATEGORIES.join('、')}`, 400)

    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(`UPDATE checklist SET category = ?, title = ?, note = ? WHERE id = ? AND travel_id = ? AND user_id = ?`)
      .bind(category, title, note, id, travelId, userId)
      .run()

    return jsonOk({
      id,
      order: existing.order,
      category,
      title,
      note,
      is_checked: Boolean(existing.is_checked),
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

export const onRequestPatch: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const body = await context.request.json<Record<string, unknown>>()
    if (typeof body.is_checked !== 'boolean') return jsonError('is_checked 必須是 boolean', 400)
    const existing = await DB.prepare(`SELECT * FROM checklist WHERE id = ? AND travel_id = ? AND user_id = ?`)
      .bind(id, travelId, userId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆清單項目', 404)
    await DB.prepare(`UPDATE checklist SET is_checked = ? WHERE id = ? AND travel_id = ? AND user_id = ?`)
      .bind(body.is_checked ? 1 : 0, id, travelId, userId)
      .run()
    return jsonOk({
      id,
      order: existing.order,
      category: existing.category,
      title: existing.title,
      note: existing.note,
      is_checked: body.is_checked,
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'patch failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    await DB.prepare(`DELETE FROM checklist WHERE id = ? AND travel_id = ? AND user_id = ?`).bind(id, travelId, userId).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
