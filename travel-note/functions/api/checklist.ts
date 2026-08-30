import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'
import { CHECKLIST_CATEGORIES, isValidCategory } from '../lib/enums'

export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const { results } = await DB.prepare(
      `SELECT id, "order", category, title, note, is_checked
       FROM checklist WHERE user_id = ?
       ORDER BY "order" ASC`,
    ).bind(userId).all<Record<string, unknown>>()

    const data = (results ?? []).map((row) => ({ ...row, is_checked: Boolean(row.is_checked) }))
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!category || !title) return jsonError('category 與 title 為必填', 400)
    if (!isValidCategory(category, CHECKLIST_CATEGORIES)) return jsonError(`category 必須是：${CHECKLIST_CATEGORIES.join('、')}`, 400)

    const note = String(body.note ?? '')

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM checklist WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `chk_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO checklist (id, user_id, "order", category, title, note, is_checked)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
    )
      .bind(id, userId, order, category, title, note)
      .run()

    return jsonOk({ id, order, category, title, note, is_checked: false })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
