import { api } from '@/http/api-client'
import { clearAuthCookie, getAuthCookie, setAuthCookie } from '@/lib/auth/auth-cookie'
import { buildLoginRedirectPath, sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { appendSetCookies, getCookieFromResponse } from '@/lib/http/set-cookie'
import { AuthResponse } from '@pulselane/contracts'
import { NextRequest, NextResponse } from 'next/server'

async function performRefresh() {
  const session = await getAuthCookie()

  if (!session) {
    return {
      ok: false as const,
      status: 401
    }
  }

  const backendResponse = await api<AuthResponse>('/api/v1/auth/refresh', { method: 'POST' })

  if (!backendResponse.ok) {
    return {
      ok: false as const,
      response: backendResponse
    }
  }

  const data = await backendResponse.json()
  const refreshToken = getCookieFromResponse(backendResponse, 'refresh_token') ?? session.refreshToken
  const deviceId = getCookieFromResponse(backendResponse, 'device_id') ?? session.deviceId

  await setAuthCookie({
    ...session,
    accessToken: data.accessToken,
    accessTokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
    refreshToken,
    deviceId
  })

  return {
    ok: true as const,
    response: backendResponse
  }
}

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectTo(request.nextUrl.searchParams.get('redirectTo'))
  const result = await performRefresh()

  if (!result.ok) {
    if (result.status === 401) {
      await clearAuthCookie()
    }

    const response = NextResponse.redirect(new URL(buildLoginRedirectPath(redirectTo), request.url))

    if (result.response) {
      return appendSetCookies(result.response, response)
    }

    return response
  }

  return appendSetCookies(result.response, NextResponse.redirect(new URL(redirectTo, request.url)))
}

export async function POST() {
  const result = await performRefresh()

  if (!result.ok) {
    if (result.status === 401) {
      await clearAuthCookie()
    }

    const response = NextResponse.json({ message: 'Failed to refresh session.' }, { status: result.status })

    if (result.response) {
      return appendSetCookies(result.response, response)
    }

    return response
  }

  return appendSetCookies(result.response, new NextResponse(null, { status: 204 }))
}
