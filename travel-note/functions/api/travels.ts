import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'
import { sha256Hex } from '../utils/hash'

const MAX_ROWS_PER_TABLE = 500
const MAX_STRING_LEN = 4000

function str(value: unknown, max = MAX_STRING_LEN): string {
  return String(value ?? '').slice(0, max)
}
function nullableStr(value: unknown, max = MAX_STRING_LEN): string | null {
  if (value === null || value === undefined || value === '') return null
  return str(value, max)
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

type DetailContent = {
  itinerary: Record<string, unknown>[]
  documents: Record<string, unknown>[]
  info: Record<string, unknown>[]
  checklist: Record<string, unknown>[]
}

// order 不吃輸入內容：一律用陣列位置編號，使用者寫匯入/範例資料時不用管 order
function buildDetailInserts(DB: D1Database, travelId: string, userId: string, content: DetailContent) {
  return [
    ...content.itinerary.map((it, i) =>
      DB.prepare(
        `INSERT INTO itinerary (id, travel_id, user_id, "order", date, time, title, location, map_url, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `it_${travelId}_${i}`, travelId, userId, i + 1,
        str(it.date, 20), nullableStr(it.time, 20), str(it.title, 200),
        nullableStr(it.location, 300), nullableStr(it.map_url, 1000), nullableStr(it.note, MAX_STRING_LEN),
      ),
    ),
    ...content.documents.map((doc, i) =>
      DB.prepare(
        `INSERT INTO documents (id, travel_id, user_id, "order", category, title, date_start, date_end, map_url, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `doc_${travelId}_${i}`, travelId, userId, i + 1,
        str(doc.category, 50), str(doc.title, 200),
        nullableStr(doc.date_start, 20), nullableStr(doc.date_end, 20),
        nullableStr(doc.map_url, 1000), nullableStr(doc.note, MAX_STRING_LEN),
      ),
    ),
    ...content.info.map((row, i) =>
      DB.prepare(
        `INSERT INTO info (id, travel_id, user_id, "order", category, title, map_url, note, is_checked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `info_${travelId}_${i}`, travelId, userId, i + 1,
        str(row.category, 50), str(row.title, 200),
        nullableStr(row.map_url, 1000), nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
      ),
    ),
    ...content.checklist.map((row, i) =>
      DB.prepare(
        `INSERT INTO checklist (id, travel_id, user_id, "order", category, title, note, is_checked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `chk_${travelId}_${i}`, travelId, userId, i + 1,
        nullableStr(row.category, 50), str(row.title, 200),
        nullableStr(row.note, MAX_STRING_LEN), bool(row.is_checked) ? 1 : 0,
      ),
    ),
  ]
}

export const onRequestPost: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId

  try {
    // 在解析成物件之前先保留原始文字：新建 / 取代旅行都算「匯入」，
    // 存一份原文備份，之後若匯入邏輯有問題可以直接從 DB 查原始資料手動復原。
    // hash 相同（同一份內容）就用 INSERT OR IGNORE 略過，不重複備份。
    const rawText = await context.request.text()
    let body: Record<string, unknown> | null
    try {
      body = JSON.parse(rawText)
    } catch {
      body = null
    }
    if (!body || typeof body !== 'object') return jsonError('建立內容不是有效的 JSON', 400)

    const rawHash = await sha256Hex(rawText)
    await DB.prepare(`INSERT OR IGNORE INTO import_raw_logs (hash, raw_data, user_id) VALUES (?, ?, ?)`)
      .bind(rawHash, rawText, userId)
      .run()

    const title = str(body.title, 200).trim()
    if (!title) return jsonError('title 為必填', 400)

    const date_start = nullableStr(body.date_start, 20) ?? ''
    const date_end = nullableStr(body.date_end, 20) ?? ''

    // 附加內容一律是可選的：不帶就是建立空白旅行，帶了就一次寫入完整內容
    const content: DetailContent = {
      itinerary: rows(body.itinerary).filter((r) => str(r.title).trim()),
      documents: rows(body.documents).filter((r) => str(r.title).trim()),
      info: rows(body.info).filter((r) => str(r.title).trim()),
      checklist: rows(body.checklist).filter((r) => str(r.title).trim()),
    }

    // 是否覆蓋現有旅行，完全看有沒有帶 travel_id：這個欄位只會由前端在「旅行頁面 header 匯入（取代目前旅行）」
    // 這個入口明確帶入，一般的匯入（清單／切換旅行 drawer）或匯出格式本身都不會有這欄位。
    // 這裡仍然檢查 user_id 擁有權才會真的覆蓋，避免猜到別人的 travel_id 也能亂改。
    // 覆蓋只清空重寫明細內容，id / order / travel_members 都不動，網址、分享連結、共編旅伴因此不受影響。
    const overwriteTravelId = nullableStr(body.travel_id, 100)
    if (overwriteTravelId) {
      const existing = await DB.prepare(`SELECT "order" FROM travels WHERE id = ? AND user_id = ?`)
        .bind(overwriteTravelId, userId)
        .first<{ order: number }>()

      if (existing) {
        await DB.batch([
          DB.prepare(`UPDATE travels SET title = ?, date_start = ?, date_end = ? WHERE id = ?`)
            .bind(title, date_start, date_end, overwriteTravelId),
          DB.prepare(`DELETE FROM itinerary WHERE travel_id = ?`).bind(overwriteTravelId),
          DB.prepare(`DELETE FROM documents WHERE travel_id = ?`).bind(overwriteTravelId),
          DB.prepare(`DELETE FROM info WHERE travel_id = ?`).bind(overwriteTravelId),
          DB.prepare(`DELETE FROM checklist WHERE travel_id = ?`).bind(overwriteTravelId),
          ...buildDetailInserts(DB, overwriteTravelId, userId, content),
        ])

        return jsonOk({
          travel: { id: overwriteTravelId, title, date_start, date_end, order: existing.order },
          inserted: {
            itinerary: content.itinerary.length,
            documents: content.documents.length,
            info: content.info.length,
            checklist: content.checklist.length,
          },
          overwritten: true,
        })
      }
    }

    const { results } = await DB.prepare(
      `SELECT COALESCE(MAX("order"), 0) + 1 AS next_order FROM travels WHERE user_id = ?`,
    ).bind(userId).all<{ next_order: number }>()
    const order = results?.[0]?.next_order ?? 1

    const id = `trip_${crypto.randomUUID().slice(0, 8)}`

    await DB.batch([
      DB.prepare(
        `INSERT INTO travels (id, user_id, title, date_start, date_end, "order")
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(id, userId, title, date_start, date_end, order),
      ...buildDetailInserts(DB, id, userId, content),
    ])

    return jsonOk({
      travel: { id, title, date_start, date_end, order },
      inserted: {
        itinerary: content.itinerary.length,
        documents: content.documents.length,
        info: content.info.length,
        checklist: content.checklist.length,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'create failed', 500)
  }
}
