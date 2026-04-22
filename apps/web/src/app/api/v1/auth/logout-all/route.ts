import { api } from '@/http/api-client'
import { clearAuthCookie } from '@/lib/auth/auth-cookie'
import { NextResponse } from 'next/server'

export async function POST() {
  const backendResponse = await api('/api/v1/auth/logout-all', { method: 'POST' })

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText
    })
  }

  await clearAuthCookie()

  return new NextResponse(null, { status: 204 })
}
