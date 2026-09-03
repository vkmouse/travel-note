import type { Env, TravelAuthContext } from '../../../../types'
import { jsonError, jsonOk } from '../../../../lib/response'
import { INFO_CATEGORIES, isValidCategory } from '../../../../lib/enums'

export const onRequestPut: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM info WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆資訊', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? existing.category)
    const title = String(body.title ?? existing.title)
    if (!category || !title) return jsonError('category 與 title 為必填', 400)
    if (!isValidCategory(category, INFO_CATEGORIES)) return jsonError(`category 必須是：${INFO_CATEGORIES.join('、')}`, 400)

    const map_url = String(body.map_url ?? existing.map_url ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(`UPDATE info SET category = ?, title = ?, map_url = ?, note = ? WHERE id = ? AND travel_id = ?`)
      .bind(category, title, map_url, note, id, travelId)
      .run()

    return jsonOk({
      id,
      order: existing.order,
      category,
      title,
      map_url,
      note,
      is_checked: Boolean(existing.is_checked),
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

export const onRequestPatch: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    const body = await context.request.json<Record<string, unknown>>()
    if (typeof body.is_checked !== 'boolean') return jsonError('is_checked 必須是 boolean', 400)
    const existing = await DB.prepare(`SELECT * FROM info WHERE id = ? AND travel_id = ?`)
      .bind(id, travelId)
      .first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆資訊', 404)
    await DB.prepare(`UPDATE info SET is_checked = ? WHERE id = ? AND travel_id = ?`)
      .bind(body.is_checked ? 1 : 0, id, travelId)
      .run()
    return jsonOk({
      id,
      order: existing.order,
      category: existing.category,
      title: existing.title,
      map_url: existing.map_url,
      note: existing.note,
      is_checked: body.is_checked,
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'patch failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId
  const id = context.params.id as string

  try {
    await DB.prepare(`DELETE FROM info WHERE id = ? AND travel_id = ?`).bind(id, travelId).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
