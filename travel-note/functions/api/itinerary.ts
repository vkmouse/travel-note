import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const { results } = await DB.prepare(
      `SELECT id, "order", date, time, title, location, map_url, note
       FROM itinerary
       ORDER BY date ASC, "order" ASC`,
    ).all()

    return jsonOk(results ?? [])
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}
