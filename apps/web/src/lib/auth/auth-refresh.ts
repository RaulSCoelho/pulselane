import { api } from '@/http/api-client'

import { resolveAppUrl } from '../http/app-url'

export async function refreshAuthCookieSession() {
  const backendResponse = await api(await resolveAppUrl('/api/v1/auth/refresh'), { method: 'POST' })

  if (!backendResponse.ok) {
    return false
  }

  return true
}
