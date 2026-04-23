import { DEVICE_ID_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../auth/auth-constants'
import { getAuthSession } from '../auth/auth-session'
import { mergeCookieHeader } from './set-cookie'

export async function setSessionHeaders(request: Request) {
  const session = await getAuthSession()

  if (!session) {
    return
  }

  const cookieOverrides: Record<string, string> = {}

  if (session.refreshToken) {
    cookieOverrides[REFRESH_TOKEN_COOKIE_NAME] = session.refreshToken
  }

  if (session.deviceId) {
    cookieOverrides[DEVICE_ID_COOKIE_NAME] = session.deviceId
  }

  if (Object.keys(cookieOverrides).length > 0) {
    request.headers.set('cookie', mergeCookieHeader(request.headers.get('cookie'), cookieOverrides))
  }

  if (session.accessToken && !request.headers.has('Authorization')) {
    request.headers.set('Authorization', `Bearer ${session.accessToken}`)
  }
}
