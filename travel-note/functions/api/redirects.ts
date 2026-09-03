import type { AuthContext, Env } from '../types'
import { jsonError, jsonOk } from '../lib/response'

// 專門用來展開短網址（例如 Google 地圖分享出來的 maps.app.goo.gl）：
// 對目標網址發一次 request，redirect: 'manual' 讓 fetch 不要自動跟著轉址走，
// 這樣才讀得到第一手的 Location header；沒有就回傳 null，不算錯誤。
export const onRequestGet: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { searchParams } = new URL(context.request.url)
  const rawUrl = searchParams.get('url')
  if (!rawUrl) return jsonError('缺少 url 參數', 400)

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return jsonError('url 參數不是有效的網址', 400)
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return jsonError('url 只能是 http 或 https', 400)
  }

  try {
    const res = await fetch(target.toString(), { method: 'GET', redirect: 'manual' })
    return jsonOk({ location: res.headers.get('Location') ?? null })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : '無法連線到目標網址', 502)
  }
}
