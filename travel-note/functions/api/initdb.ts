import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'
import { CREATE_TABLE_STATEMENTS } from '../lib/schema'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    await DB.batch(CREATE_TABLE_STATEMENTS.map((sql) => DB.prepare(sql)))
    return jsonOk({ tables: ['itinerary', 'documents', 'info', 'checklist'] })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'initdb failed', 500)
  }
}
