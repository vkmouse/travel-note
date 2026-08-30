import type { AuthContext, Env } from '../../types'
import { CREATE_TABLE_STATEMENTS } from '../../lib/schema'
import { verifyAccessAssertion, resolveEmailByCommonName } from '../../utils/access'
import { signAccessToken, signRefreshToken, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../../utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, buildAppCookie } from '../../utils/cookie'

export const onRequest: PagesFunction<Env, any, AuthContext> = async (context) => {
  if (context.request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  const { env } = context
  if (!env.APP_JWT_SECRET) return new Response('Unauthorized', { status: 401 })
  let email: string | null = null
  if (env.DEV_AUTH_BYPASS === 'true') {
    try {
      const users = JSON.parse(env.DEV_AUTH_USERS ?? '{}') as Record<string, { email?: unknown; secret?: unknown }>
      const clientId = context.request.headers.get('CF-Access-Client-Id') ?? ''
      const clientSecret = context.request.headers.get('CF-Access-Client-Secret') ?? ''
      const user = users[clientId]
      if (user && user.secret === clientSecret && typeof user.email === 'string' && user.email) email = user.email
    } catch {
      email = null
    }
  } else {
    const assertion = context.request.headers.get('Cf-Access-Jwt-Assertion')
    const commonName = assertion ? await verifyAccessAssertion(env, assertion) : null
    email = commonName ? resolveEmailByCommonName(env.SERVICE_IDENTITY_MAP, commonName) : null
  }
  if (!email) return new Response('Unauthorized', { status: 401 })

  await env.DB.batch(CREATE_TABLE_STATEMENTS.map((sql) => env.DB.prepare(sql)))
  const userId = `user_${crypto.randomUUID()}`
  await env.DB.prepare(
    `INSERT INTO users (id, email) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET email = excluded.email`,
  ).bind(userId, email).run()
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const identity = { email, userId: user.id }
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(env.APP_JWT_SECRET, identity), signRefreshToken(env.APP_JWT_SECRET, identity),
  ])
  const response = Response.json(identity)
  response.headers.append('Set-Cookie', buildAppCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_TOKEN_TTL_SECONDS))
  response.headers.append('Set-Cookie', buildAppCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_TTL_SECONDS))
  return response
}
