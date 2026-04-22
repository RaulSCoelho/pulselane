import { api } from '@/http/api-client'
import { buildLoginRedirectPath, sanitizeRedirectTo } from '@/lib/auth/auth-redirect'
import { getAuthSession } from '@/lib/auth/auth-session'
import { clearAccessTokenCookie, setAccessTokenCookie } from '@/lib/auth/auth-token'
import { appendSetCookies } from '@/lib/http/set-cookie'
import { AuthResponse } from '@pulselane/contracts'
import { NextRequest, NextResponse } from 'next/server'

async function performRefresh() {
  const session = await getAuthSession()

  if (!session?.refreshToken) {
    return {
      ok: false as const,
      status: 401
    }
  }

  const backendResponse = await api<AuthResponse>('/api/v1/auth/refresh', { method: 'POST' })

  if (!backendResponse.ok) {
    return {
      ok: false as const,
      status: backendResponse.status
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

    clearAccessTokenCookie(response)

    return response
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  appendSetCookies(result.backendResponse, response)
  setAccessTokenCookie(response, result.data.accessToken, result.data.expiresIn)

  return response
}

export async function POST() {
  const result = await performRefresh()

  if (!result.ok) {
    const response = NextResponse.json({ message: 'Failed to refresh session.' }, { status: result.status })

    if (result.status === 401) {
      clearAccessTokenCookie(response)
    }

    return response
  }

  const response = new NextResponse(null, { status: 204 })

  appendSetCookies(result.backendResponse, response)
  setAccessTokenCookie(response, result.data.accessToken, result.data.expiresIn)

  return response
}
