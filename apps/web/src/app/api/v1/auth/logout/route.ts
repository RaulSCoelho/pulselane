import { proxyErrorResponse } from '@/app/api/v1/auth/utils'
import { serverApiFetch } from '@/http/server-api-client'
import { NextResponse } from 'next/server'

export async function POST() {
  const backendResponse = await serverApiFetch('auth/logout', { method: 'POST' })

  if (!backendResponse.ok) {
    return await proxyErrorResponse(backendResponse)
  }

  const payload = await backendResponse.json()

  return NextResponse.json(payload, { status: 200 })
}
