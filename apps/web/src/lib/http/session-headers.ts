import { getAuthCookie } from '../auth/auth-cookie'
import { mergeCookieHeader } from './set-cookie'

export async function setSessionHeaders(request: Request) {
  const session = await getAuthCookie()

  if (!session) {
    return
  }

  const overrides = {
    refresh_token: session.refreshToken,
    ...(session.deviceId && { device_id: session.deviceId })
  }

  request.headers.set('cookie', mergeCookieHeader(request.headers.get('cookie'), overrides))
  request.headers.set('Authorization', `Bearer ${session.accessToken}`)
}
