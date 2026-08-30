import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const category = new URL(context.request.url).searchParams.get('category')

  try {
    const stmt = category
      ? DB.prepare(
          `SELECT id, "order", category, title, date_start, date_end, link, note
           FROM documents WHERE category = ?
           ORDER BY "order" ASC`,
        ).bind(category)
      : DB.prepare(
          `SELECT id, "order", category, title, date_start, date_end, link, note
           FROM documents
           ORDER BY "order" ASC`,
        )

    const { results } = await stmt.all()
    return jsonOk(results ?? [])
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}
