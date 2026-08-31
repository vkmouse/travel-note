import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

// 注意：這個端點刻意放在 /api/travel-import，而不是 /api/travels/import。
// 原因跟 sample-travel.ts 的註解一樣：/api/travels/import 會被
// functions/api/travels/[travelId]/_middleware.ts 當成 travelId="import" 處理，
// 查無此 travel 就直接 404，import 端點永遠執行不到。
// 匯入本身是要新建一趟旅行，不需要既有的 travelId，只依賴最外層 _middleware.ts
// 驗證過的 userId 即可。

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

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    const body = await context.request.json<Record<string, unknown>>().catch(() => null)
    if (!body || typeof body !== 'object') return jsonError('匯入內容不是有效的 JSON', 400)

    const travelPayload = (body.travel ?? {}) as Record<string, unknown>
    const title = str(travelPayload.title, 200).trim()
    if (!title) return jsonError('匯入內容缺少旅行名稱（travel.title）', 400)
    const date_start = nullableStr(travelPayload.date_start, 20) ?? ''
    const date_end = nullableStr(travelPayload.date_end, 20) ?? ''

    const itinerary = rows(body.itinerary).filter((r) => str(r.title).trim())
    const documents = rows(body.documents).filter((r) => str(r.title).trim())
    const info = rows(body.info).filter((r) => str(r.title).trim())
    const checklist = rows(body.checklist).filter((r) => str(r.title).trim())

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM travels WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const travelOrder = results?.[0]?.next_order ?? 1

    const travelId = `trip_${crypto.randomUUID().slice(0, 8)}`

    const statements = [
      DB.prepare(
        `INSERT INTO travels (id, user_id, title, date_start, date_end, "order") VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(travelId, userId, title, date_start, date_end, travelOrder),

      ...itinerary.map((it, i) =>
        DB.prepare(
          `INSERT INTO itinerary (id, travel_id, user_id, "order", date, time, title, location, map_url, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `it_${travelId}_${i}`, travelId, userId, num(it.order, i + 1),
          str(it.date, 20), nullableStr(it.time, 20), str(it.title, 200),
          nullableStr(it.location, 300), nullableStr(it.map_url, 1000), nullableStr(it.note, MAX_STRING_LEN),
        ),
      ),
      ...documents.map((doc, i) =>
        DB.prepare(
          `INSERT INTO documents (id, travel_id, user_id, "order", category, title, date_start, date_end, link, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `doc_${travelId}_${i}`, travelId, userId, num(doc.order, i + 1),
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
          `info_${travelId}_${i}`, travelId, userId, num(row.order, i + 1),
          str(row.category, 50), str(row.title, 200),
          nullableStr(row.link, 1000), nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
        ),
      ),
      ...checklist.map((row, i) =>
        DB.prepare(
          `INSERT INTO checklist (id, travel_id, user_id, "order", category, title, note, is_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          `chk_${travelId}_${i}`, travelId, userId, num(row.order, i + 1),
          nullableStr(row.category, 50), str(row.title, 200),
          nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
        ),
      ),
    ]

    await DB.batch(statements)

    return jsonOk({
      travel: { id: travelId, title, date_start, date_end, order: travelOrder },
      inserted: {
        itinerary: itinerary.length,
        documents: documents.length,
        info: info.length,
        checklist: checklist.length,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'import failed', 500)
  }
}
