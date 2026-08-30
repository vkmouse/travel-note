import { jwtVerify, SignJWT } from 'jose'

export type AppTokenType = 'access' | 'refresh'
export interface AppTokenIdentity { email: string; userId: string }
export const ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 10 * 365 * 24 * 60 * 60

const key = (secret: string) => new TextEncoder().encode(secret)

async function sign(secret: string, identity: AppTokenIdentity, type: AppTokenType, ttl: number) {
  return new SignJWT({ ...identity, type })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttl}s`).sign(key(secret))
}

export const signAccessToken = (secret: string, identity: AppTokenIdentity) => sign(secret, identity, 'access', ACCESS_TOKEN_TTL_SECONDS)
export const signRefreshToken = (secret: string, identity: AppTokenIdentity) => sign(secret, identity, 'refresh', REFRESH_TOKEN_TTL_SECONDS)

export async function verifyAppToken(secret: string, token: string, expectedType: AppTokenType): Promise<AppTokenIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret))
    if (typeof payload.email !== 'string' || typeof payload.userId !== 'string' || payload.type !== expectedType) return null
    return { email: payload.email, userId: payload.userId }
  } catch { return null }
}
