import { resilientGet } from '@/http/resilient-fetch'
import { serverApi } from '@/http/server-api-client'
import { buildLoginRedirectPath, sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { getAuthSession } from '@/lib/auth/auth-session'
import { clearAccessTokenCookie, setAccessTokenCookie } from '@/lib/auth/auth-token'
import { clearRequestSnapshots } from '@/lib/http/request-snapshot/cookies'
import { appendSetCookies } from '@/lib/http/set-cookie'
import { AuthResponse, meResponseSchema } from '@pulselane/contracts'
import { NextRequest, NextResponse } from 'next/server'

async function performRefresh() {
  const session = await getAuthSession()

  if (!session?.refreshToken) {
    return {
      ok: false as const,
      status: 401
    }
  }

  const backendResponse = await serverApi<AuthResponse>('/api/v1/auth/refresh', { method: 'POST' })

  if (!backendResponse.ok) {
    return {
      ok: false as const,
      status: backendResponse.status,
      backendResponse
    }
  }

  return {
    ok: true as const,
    status: backendResponse.status,
    backendResponse,
    data: await backendResponse.json()
  }
}

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectTo(request.nextUrl.searchParams.get('redirectTo'))
  const result = await performRefresh()

  if (!result.ok) {
    const response = NextResponse.redirect(new URL(buildLoginRedirectPath(redirectTo), request.url))

    if (result.status === 401) {
      clearAccessTokenCookie(response)
      clearRequestSnapshots(response)
    }

    return response
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  setAccessTokenCookie(response, result.data.accessToken)
  appendSetCookies(result.backendResponse, response)

  await resilientGet({
    key: 'auth.me',
    path: '/api/v1/auth/me',
    schema: meResponseSchema,
    maxAgeSeconds: 300,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 3600,
    userScoped: true,
    request: {
      headers: {
        Authorization: `Bearer ${result.data.accessToken}`
      }
    },
    snapshotTarget: response
  })

  return response
}

export async function POST() {
  const result = await performRefresh()

  if (!result.ok) {
    const response = NextResponse.json({ message: 'Failed to refresh session.' }, { status: result.status })

    if (result.status === 401) {
      clearAccessTokenCookie(response)
      clearRequestSnapshots(response)
    }

    return response
  }

  const response = new NextResponse(null, { status: 204 })

  setAccessTokenCookie(response, result.data.accessToken)
  appendSetCookies(result.backendResponse, response)

  await resilientGet({
    key: 'auth.me',
    path: '/api/v1/auth/me',
    schema: meResponseSchema,
    maxAgeSeconds: 300,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 3600,
    userScoped: true,
    request: {
      headers: {
        Authorization: `Bearer ${result.data.accessToken}`
      }
    },
    snapshotTarget: response
  })

  return response
}
