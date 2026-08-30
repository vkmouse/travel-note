import type { Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

const SAMPLE_ITINERARY = [
  {
    id: 'it_01',
    order: 1,
    date: '2026-10-05',
    time: '09:00',
    title: '抵達成田機場',
    location: '成田機場 Terminal 1',
    map_url: 'https://maps.google.com/?q=成田機場',
    note: '領取JR PASS',
  },
  {
    id: 'it_02',
    order: 2,
    date: '2026-10-05',
    time: '14:00',
    title: '淺草寺',
    location: '淺草寺',
    map_url: 'https://maps.google.com/?q=淺草寺',
    note: '',
  },
]

const SAMPLE_DOCUMENTS = [
  {
    id: 'doc_01',
    order: 1,
    category: '住宿',
    title: '東京喜來登飯店',
    date_start: '2026-10-05',
    date_end: '2026-10-08',
    link: 'https://booking.com/xxx',
    note: '訂單號 BK123456，Check-in 15:00',
  },
  {
    id: 'doc_02',
    order: 2,
    category: '機票',
    title: '長榮 BR198 台北→東京',
    date_start: '2026-10-05',
    date_end: '',
    link: '',
    note: '去程 08:00起飛，訂位代號 ABC123',
  },
  {
    id: 'doc_03',
    order: 3,
    category: '簽證',
    title: '日本短期簽證',
    date_start: '',
    date_end: '',
    link: '',
    note: '免簽，護照效期需6個月以上',
  },
]

const SAMPLE_INFO = [
  {
    id: 'info_01',
    order: 1,
    category: '工具',
    title: '日圓匯率換算',
    link: 'https://www.xe.com',
    note: '',
    is_checked: false,
  },
  {
    id: 'info_02',
    order: 2,
    category: '靈感',
    title: '小紅書推薦的原宿咖啡廳',
    link: 'https://xhslink.com/xxx',
    note: '朋友說必吃鬆餅',
    is_checked: false,
  },
  {
    id: 'info_03',
    order: 3,
    category: '緊急聯絡',
    title: '駐日台北經濟文化代表處',
    link: '',
    note: '電話：03-3280-7811，地址：東京都港區白金台5-20-2',
    is_checked: false,
  },
]

const SAMPLE_CHECKLIST = [
  {
    id: 'chk_01',
    order: 1,
    category: '證件',
    title: '護照正本',
    note: '確認效期6個月以上',
    is_checked: false,
  },
  {
    id: 'chk_02',
    order: 2,
    category: '電子用品',
    title: '萬國轉接頭',
    note: '',
    is_checked: true,
  },
]

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env

  try {
    const statements = [
      ...SAMPLE_ITINERARY.map((it) =>
        DB.prepare(
          `INSERT OR REPLACE INTO itinerary (id, "order", date, time, title, location, map_url, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(it.id, it.order, it.date, it.time, it.title, it.location, it.map_url, it.note),
      ),
      ...SAMPLE_DOCUMENTS.map((doc) =>
        DB.prepare(
          `INSERT OR REPLACE INTO documents (id, "order", category, title, date_start, date_end, link, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(doc.id, doc.order, doc.category, doc.title, doc.date_start, doc.date_end, doc.link, doc.note),
      ),
      ...SAMPLE_INFO.map((info) =>
        DB.prepare(
          `INSERT OR REPLACE INTO info (id, "order", category, title, link, note, is_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(info.id, info.order, info.category, info.title, info.link, info.note, info.is_checked ? 1 : 0),
      ),
      ...SAMPLE_CHECKLIST.map((chk) =>
        DB.prepare(
          `INSERT OR REPLACE INTO checklist (id, "order", category, title, note, is_checked)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(chk.id, chk.order, chk.category, chk.title, chk.note, chk.is_checked ? 1 : 0),
      ),
    ]

    await DB.batch(statements)

    return jsonOk({
      inserted: {
        itinerary: SAMPLE_ITINERARY.length,
        documents: SAMPLE_DOCUMENTS.length,
        info: SAMPLE_INFO.length,
        checklist: SAMPLE_CHECKLIST.length,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'sample insert failed', 500)
  }
}
