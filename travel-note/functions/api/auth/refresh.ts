import type { AuthContext, Env } from '../../types'
import { verifyAppToken, signAccessToken, ACCESS_TOKEN_TTL_SECONDS } from '../../utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, buildAppCookie, getCookie } from '../../utils/cookie'

export const onRequest: PagesFunction<Env, any, AuthContext> = async (context) => {
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const secret = context.env.APP_JWT_SECRET
  const token = getCookie(context.request.headers.get('Cookie'), REFRESH_TOKEN_COOKIE_NAME)
  if (!secret || !token) return new Response('Unauthorized', { status: 401 })
  const identity = await verifyAppToken(secret, token, 'refresh')
  if (!identity) return new Response('Unauthorized', { status: 401 })
  const response = Response.json(identity)
  response.headers.append('Set-Cookie', buildAppCookie(ACCESS_TOKEN_COOKIE_NAME, await signAccessToken(secret, identity), ACCESS_TOKEN_TTL_SECONDS))
  return response
}
