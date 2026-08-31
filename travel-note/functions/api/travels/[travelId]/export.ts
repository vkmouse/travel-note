import type { Env, TravelAuthContext } from '../../../types'
import { jsonError, jsonOk } from '../../../lib/response'
import { normalizeDocumentCategory } from '../../../lib/enums'

// 匯出格式版本號：未來若欄位有不相容變動，import 那邊可以依此判斷如何處理舊格式
const EXPORT_FORMAT = 'travel-note.export'
const EXPORT_VERSION = 1

export const onRequestGet: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const travelId = context.data.travelId

  try {
    const travel = await DB.prepare(
      `SELECT title, date_start, date_end FROM travels WHERE id = ?`,
    ).bind(travelId).first<{ title: string; date_start: string | null; date_end: string | null }>()
    if (!travel) return jsonError('找不到這趟旅行', 404)

    // 只匯出旅行本身的內容，不含成員/邀請：那些是跟帳號綁定的，匯入到別人帳號下沒有意義
    const [itinerary, documents, info, checklist] = await Promise.all([
      DB.prepare(
        `SELECT "order", date, time, title, location, map_url, note FROM itinerary WHERE travel_id = ? ORDER BY "order" ASC`,
      ).bind(travelId).all(),
      DB.prepare(
        `SELECT "order", category, title, date_start, date_end, link, note FROM documents WHERE travel_id = ? ORDER BY "order" ASC`,
      ).bind(travelId).all(),
      DB.prepare(
        `SELECT "order", category, title, link, note, is_checked FROM info WHERE travel_id = ? ORDER BY "order" ASC`,
      ).bind(travelId).all(),
      DB.prepare(
        `SELECT "order", category, title, note, is_checked FROM checklist WHERE travel_id = ? ORDER BY "order" ASC`,
      ).bind(travelId).all(),
    ])

    return jsonOk({
      type: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      travel: { title: travel.title, date_start: travel.date_start, date_end: travel.date_end },
      itinerary: (itinerary.results ?? []),
      documents: (documents.results ?? []).map((row) => ({ ...row, category: normalizeDocumentCategory((row as { category: string }).category) })),
      info: (info.results ?? []).map((row) => ({ ...row, is_checked: Boolean((row as { is_checked: number }).is_checked) })),
      checklist: (checklist.results ?? []).map((row) => ({ ...row, is_checked: Boolean((row as { is_checked: number }).is_checked) })),
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'export failed', 500)
  }
}
