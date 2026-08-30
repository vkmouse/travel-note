export interface Env {
  DB: D1Database
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  SERVICE_IDENTITY_MAP?: string
  APP_JWT_SECRET?: string
  DEV_AUTH_BYPASS?: string
  DEV_AUTH_USERS?: string
}

export interface AuthContext extends Record<string, unknown> {
  email: string
  userId: string
}
