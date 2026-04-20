import { badRequestResponse, proxyErrorResponse, parseRequestJson } from '@/app/api/v1/auth/utils'
import { serverApiFetch } from '@/http/server-api-client'
import { setAccessTokenCookie } from '@/lib/auth/auth-cookies'
import { AuthResponse, loginRequestSchema } from '@pulselane/contracts/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let body: ReturnType<typeof loginRequestSchema.parse>

  try {
    body = await parseRequestJson(request, loginRequestSchema.parse)
  } catch {
    return badRequestResponse('Invalid login payload')
  }

  const backendResponse = await serverApiFetch<AuthResponse>('auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!backendResponse.ok) {
    return proxyErrorResponse(backendResponse)
  }

  const payload = await backendResponse.json()

  setAccessTokenCookie(payload.accessToken, payload.expiresIn)

  return new NextResponse(null, { status: 204 })
}
