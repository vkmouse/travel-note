import { setCurrentEmail } from '../composables/useCurrentUser'

export interface AccessCredentials { clientId: string; clientSecret: string }
const CLIENT_ID_KEY = 'CF_ACCESS_CLIENT_ID'
const CLIENT_SECRET_KEY = 'CF_ACCESS_CLIENT_SECRET'

export function getStoredCredentials(): AccessCredentials | null {
  const clientId = localStorage.getItem(CLIENT_ID_KEY)
  const clientSecret = localStorage.getItem(CLIENT_SECRET_KEY)
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export function storeCredentials(credentials: AccessCredentials) {
  localStorage.setItem(CLIENT_ID_KEY, credentials.clientId)
  localStorage.setItem(CLIENT_SECRET_KEY, credentials.clientSecret)
}

export function getAccessHeaders(): HeadersInit {
  const credentials = getStoredCredentials()
  return credentials ? {
    'CF-Access-Client-Id': credentials.clientId,
    'CF-Access-Client-Secret': credentials.clientSecret,
  } : {}
}

export async function login(credentials?: AccessCredentials): Promise<boolean> {
  const values = credentials ?? getStoredCredentials()
  if (!values) return false
  try {
    const response = await fetch('/api/auth/login', {
      headers: {
        'CF-Access-Client-Id': values.clientId,
        'CF-Access-Client-Secret': values.clientSecret,
      },
      credentials: 'include',
    })
    if (response.status !== 200) return false
    // 記下自己的 email，成員列表用來判斷「這一列是我自己」
    const identity = await response.json().catch(() => null) as { email?: string } | null
    if (identity?.email) setCurrentEmail(identity.email)
    return true
  } catch { return false }
}

export async function refreshAccessToken(): Promise<boolean> {
  const credentials = getStoredCredentials()
  if (!credentials) return false
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'CF-Access-Client-Id': credentials.clientId,
        'CF-Access-Client-Secret': credentials.clientSecret,
      },
      credentials: 'include',
    })
    return response.status === 200
  } catch { return false }
}
