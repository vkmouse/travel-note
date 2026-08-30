import type { Env } from '../../types'
import { jsonError, jsonOk } from '../../lib/response'

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const id = context.params.id as string

  try {
    const existing = await DB.prepare(`SELECT * FROM info WHERE id = ?`).bind(id).first<Record<string, unknown>>()
    if (!existing) return jsonError('找不到這筆資訊', 404)

    const body = await context.request.json<Record<string, unknown>>()
    const category = String(body.category ?? existing.category)
    const title = String(body.title ?? existing.title)
    if (!category || !title) return jsonError('category 與 title 為必填', 400)

    const link = String(body.link ?? existing.link ?? '')
    const note = String(body.note ?? existing.note ?? '')

    await DB.prepare(`UPDATE info SET category = ?, title = ?, link = ?, note = ? WHERE id = ?`)
      .bind(category, title, link, note, id)
      .run()

    return jsonOk({
      id,
      order: existing.order,
      category,
      title,
      link,
      note,
      is_checked: Boolean(existing.is_checked),
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'update failed', 500)
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env
  const id = context.params.id as string

  try {
    await DB.prepare(`DELETE FROM info WHERE id = ?`).bind(id).run()
    return jsonOk({ id })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'delete failed', 500)
  }
}
