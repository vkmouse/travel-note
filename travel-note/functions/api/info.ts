import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const category = new URL(context.request.url).searchParams.get('category')

  try {
    const stmt = category
      ? DB.prepare(
          `SELECT id, "order", category, title, link, note, is_checked
           FROM info WHERE category = ?
           ORDER BY "order" ASC`,
        ).bind(category)
      : DB.prepare(
          `SELECT id, "order", category, title, link, note, is_checked
           FROM info
           ORDER BY "order" ASC`,
        )

    const { results } = await stmt.all<Record<string, unknown>>()
    const data = (results ?? []).map((row) => ({ ...row, is_checked: Boolean(row.is_checked) }))
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}
