import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Env } from '../types'

export async function verifyAccessAssertion(
  env: Pick<Env, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD'>,
  assertion: string,
): Promise<string | null> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null
  try {
    const jwks = createRemoteJWKSet(new URL(`${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`))
    const { payload } = await jwtVerify(assertion, jwks, {
      issuer: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
    })
    return typeof payload.common_name === 'string' && payload.common_name ? payload.common_name : null
  } catch {
    return null
  }
}

export function resolveEmailByCommonName(mapText: string | undefined, commonName: string): string | null {
  if (!mapText) return null
  try {
    const map = JSON.parse(mapText) as Record<string, unknown>
    const email = map[commonName]
    return typeof email === 'string' && email ? email : null
  } catch {
    return null
  }
}
