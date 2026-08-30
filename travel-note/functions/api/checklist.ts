import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const { results } = await DB.prepare(
      `SELECT id, "order", category, title, note, is_checked
       FROM checklist
       ORDER BY "order" ASC`,
    ).all<Record<string, unknown>>()

    const data = (results ?? []).map((row) => ({ ...row, is_checked: Boolean(row.is_checked) }))
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!category || !title) return jsonError('category 與 title 為必填', 400)

    const note = String(body.note ?? '')

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM checklist`,
    ).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `chk_${crypto.randomUUID().slice(0, 8)}`
    await DB.prepare(
      `INSERT INTO checklist (id, "order", category, title, note, is_checked)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
      .bind(id, order, category, title, note)
      .run()

    return jsonOk({ id, order, category, title, note, is_checked: false })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
