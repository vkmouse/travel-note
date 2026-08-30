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
