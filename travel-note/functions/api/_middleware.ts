import type { AuthContext, Env } from '../types'
import { verifyAppToken } from '../utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME, getCookie } from '../utils/cookie'

const SKIP_AUTH = new Set(['/api/auth/login', '/api/auth/refresh'])

export const onRequest: PagesFunction<Env, any, AuthContext> = async (context) => {
  const { pathname } = new URL(context.request.url)
  if (SKIP_AUTH.has(pathname)) return context.next()
  if (!context.env.APP_JWT_SECRET) return new Response('Unauthorized', { status: 401 })
  const token = getCookie(context.request.headers.get('Cookie'), ACCESS_TOKEN_COOKIE_NAME)
  const identity = token ? await verifyAppToken(context.env.APP_JWT_SECRET, token, 'access') : null
  if (!identity) return new Response('Unauthorized', { status: 401 })
  context.data.email = identity.email
  context.data.userId = identity.userId
  return context.next()
}
