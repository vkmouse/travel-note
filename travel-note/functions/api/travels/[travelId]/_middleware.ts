import type { Env, TravelAuthContext } from '../../../types'
import { jsonError } from '../../../lib/response'

export const onRequest: PagesFunction<Env, any, TravelAuthContext> = async (context) => {
  const { DB } = context.env
  const userId = context.data.userId
  const travelId = context.params.travelId as string

  const travel = await DB.prepare(`SELECT user_id FROM travels WHERE id = ?`)
    .bind(travelId)
    .first<{ user_id: string }>()
  if (!travel) return jsonError('找不到這趟旅行', 404)

  const isOwner = travel.user_id === userId
  if (!isOwner) {
    // 不是擁有者的話，必須是已接受邀請的共享者才放行
    const member = await DB.prepare(
      `SELECT id FROM travel_members WHERE travel_id = ? AND user_id = ? AND status = 'accepted'`,
    ).bind(travelId, userId).first()
    if (!member) return jsonError('找不到這趟旅行', 404)
  }

  context.data.travelId = travelId
  context.data.isOwner = isOwner
  return context.next()
}
