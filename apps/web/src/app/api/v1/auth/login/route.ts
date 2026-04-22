import { api } from '@/http/api-client'
import { setAccessTokenCookie } from '@/lib/auth/auth-token'
import { appendSetCookies } from '@/lib/http/set-cookie'
import { AuthResponse } from '@pulselane/contracts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const backendResponse = await api<AuthResponse>('/api/v1/auth/login', {
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
  const response = new NextResponse(null, { status: 204 })

  appendSetCookies(backendResponse, response)
  setAccessTokenCookie(response, data.accessToken)

  return response
}
