import { serverApi } from '@/http/server-api-client'
import { setAccessTokenCookie } from '@/lib/auth/auth-token'
import { appendSetCookies } from '@/lib/http/set-cookie'
import { AuthResponse } from '@pulselane/contracts/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const backendResponse = await serverApi<AuthResponse>('/api/v1/auth/signup', {
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

  setAccessTokenCookie(response, data.accessToken)
  appendSetCookies(backendResponse, response)

  return response
}
