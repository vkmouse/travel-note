import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

const MAX_ROWS_PER_TABLE = 500
const MAX_STRING_LEN = 4000

function str(value: unknown, max = MAX_STRING_LEN): string {
  return String(value ?? '').slice(0, max)
}
function nullableStr(value: unknown, max = MAX_STRING_LEN): string | null {
  if (value === null || value === undefined || value === '') return null
  return str(value, max)
}
function num(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function bool(value: unknown): boolean {
  return value === true
}
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_ROWS_PER_TABLE).filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
}

export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    // 清單要同時列出自己擁有的旅行，以及被邀請且已接受的旅行，用 is_owner 讓前端分辨
    const { results } = await DB.prepare(
      `SELECT id, title, date_start, date_end, "order", created_at, 1 AS is_owner
       FROM travels WHERE user_id = ?
       UNION
       SELECT t.id, t.title, t.date_start, t.date_end, t."order", t.created_at, 0 AS is_owner
       FROM travels t
       JOIN travel_members m ON m.travel_id = t.id
       WHERE m.user_id = ? AND m.status = 'accepted'
       ORDER BY "order" ASC`,
    ).bind(userId, userId).all()

    return jsonOk((results ?? []).map((row: Record<string, unknown>) => ({ ...row, is_owner: Boolean(row.is_owner) })))
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'query failed', 500)
  }
}

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const body = await context.request.json<Record<string, unknown>>().catch(() => null)
    if (!body || typeof body !== 'object') return jsonError('建立內容不是有效的 JSON', 400)

    const title = str(body.title, 200).trim()
    if (!title) return jsonError('title 為必填', 400)

    const date_start = nullableStr(body.date_start, 20) ?? ''
    const date_end = nullableStr(body.date_end, 20) ?? ''

    // 附加內容一律是可選的：不帶就是建立空白旅行，帶了就一次寫入完整內容
    const itinerary = rows(body.itinerary).filter((r) => str(r.title).trim())
    const documents = rows(body.documents).filter((r) => str(r.title).trim())
    const info = rows(body.info).filter((r) => str(r.title).trim())
    const checklist = rows(body.checklist).filter((r) => str(r.title).trim())

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM travels WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `trip_${crypto.randomUUID().slice(0, 8)}`

    const statements = [
      DB.prepare(
        `INSERT INTO travels (id, user_id, title, date_start, date_end, "order")
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(id, userId, title, date_start, date_end, order),

      ...itinerary.map((it, i) =>
        DB.prepare(
          `INSERT INTO itinerary (id, travel_id, user_id, "order", date, time, title, location, map_url, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `it_${id}_${i}`, id, userId, num(it.order, i + 1),
          str(it.date, 20), nullableStr(it.time, 20), str(it.title, 200),
          nullableStr(it.location, 300), nullableStr(it.map_url, 1000), nullableStr(it.note, MAX_STRING_LEN),
        ),
      ),
      ...documents.map((doc, i) =>
        DB.prepare(
          `INSERT INTO documents (id, travel_id, user_id, "order", category, title, date_start, date_end, link, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `doc_${id}_${i}`, id, userId, num(doc.order, i + 1),
          str(doc.category, 50), str(doc.title, 200),
          nullableStr(doc.date_start, 20), nullableStr(doc.date_end, 20),
          nullableStr(doc.link, 1000), nullableStr(doc.note, MAX_STRING_LEN),
        ),
      ),
      ...info.map((row, i) =>
        DB.prepare(
          `INSERT INTO info (id, travel_id, user_id, "order", category, title, link, note, is_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `info_${id}_${i}`, id, userId, num(row.order, i + 1),
          str(row.category, 50), str(row.title, 200),
          nullableStr(row.link, 1000), nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
        ),
      ),
      ...checklist.map((row, i) =>
        DB.prepare(
          `INSERT INTO checklist (id, travel_id, user_id, "order", category, title, note, is_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `chk_${id}_${i}`, id, userId, num(row.order, i + 1),
          nullableStr(row.category, 50), str(row.title, 200),
          nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
        ),
      ),
    ]

    await DB.batch(statements)

    return jsonOk({
      travel: { id, title, date_start, date_end, order },
      inserted: {
        itinerary: itinerary.length,
        documents: documents.length,
        info: info.length,
        checklist: checklist.length,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
