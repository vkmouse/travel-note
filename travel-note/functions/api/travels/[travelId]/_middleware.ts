import type { Env, TravelAuthContext } from '../../../types'
import { jsonError } from '../../../lib/response'

export const onRequest: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.params.travelId as string

  const travel = await DB.prepare(`SELECT id FROM travels WHERE id = ? AND user_id = ?`)
    .bind(travelId, userId)
    .first()
  if (!travel) return jsonError('找不到這趟旅行', 404)

  context.data.travelId = travelId
  return context.next()
}
