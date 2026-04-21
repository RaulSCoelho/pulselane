import { api } from '@/http/api-client'
import { setAuthCookie } from '@/lib/auth/auth-cookie'
import { getCookieFromResponse } from '@/lib/http/set-cookie'
import { AuthResponse } from '@pulselane/contracts/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const backendResponse = await api<AuthResponse>('api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: await request.text()
  })

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText
    })
  }

  const data = await backendResponse.json()
  const refreshToken = getCookieFromResponse(backendResponse, 'refresh_token')
  const deviceId = getCookieFromResponse(backendResponse, 'device_id') ?? undefined

  if (!refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token from backend signup response.' }, { status: 500 })
  }

  await setAuthCookie({
    accessToken: data.accessToken,
    accessTokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
    refreshToken,
    deviceId
  })

  return new NextResponse(null, { status: 204 })
}
