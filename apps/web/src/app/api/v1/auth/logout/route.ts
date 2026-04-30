import { serverApi } from '@/http/server-api-client'
import { clearAccessTokenCookie } from '@/lib/auth/auth-token'
import { appendSetCookies } from '@/lib/http/set-cookie'
import { NextResponse } from 'next/server'

export async function POST() {
  const backendResponse = await serverApi('/api/v1/auth/logout', { method: 'POST' })

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText
    })
  }

  const response = new NextResponse(null, { status: 204 })

  clearAccessTokenCookie(response)
  appendSetCookies(backendResponse, response)

  return response
}
