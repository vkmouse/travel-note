import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'
import { INFO_CATEGORIES, isValidCategory } from '../lib/enums'

export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const category = new URL(context.request.url).searchParams.get('category')

  try {
    const stmt = category
      ? DB.prepare(
          `SELECT id, "order", category, title, link, note, is_checked
           FROM info WHERE user_id = ? AND category = ?
           ORDER BY "order" ASC`,
        ).bind(userId, category)
      : DB.prepare(
          `SELECT id, "order", category, title, link, note, is_checked
           FROM info WHERE user_id = ?
           ORDER BY "order" ASC`,
        ).bind(userId)

    const { results } = await stmt.all<Record<string, unknown>>()
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
    if (!isValidCategory(category, INFO_CATEGORIES)) return jsonError(`category 必須是：${INFO_CATEGORIES.join('、')}`, 400)

    const link = String(body.link ?? '')
    const note = String(body.note ?? '')

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM info WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `info_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO info (id, user_id, "order", category, title, link, note, is_checked)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    )
      .bind(id, userId, order, category, title, link, note)
      .run()

    return jsonOk({ id, order, category, title, link, note, is_checked: false })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
