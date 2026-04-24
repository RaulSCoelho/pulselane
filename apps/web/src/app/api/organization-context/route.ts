import { serverApi } from '@/http/server-api-client'
import {
  ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS,
  ACTIVE_ORGANIZATION_COOKIE_NAME
} from '@/lib/organizations/organization-context-constants'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const setActiveOrganizationRequestSchema = z.object({
  organizationId: z.string().trim().min(1)
})

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null)
  const parsedBody = setActiveOrganizationRequestSchema.safeParse(requestBody)

  if (!parsedBody.success) {
    return NextResponse.json({ message: 'Invalid organization payload' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: parsedBody.data.organizationId,
    maxAge: ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS,
    sameSite: 'lax',
    path: '/'
  })

  await serverApi('/api/v1/organizations/current', {
    headers: {
      'x-organization-id': parsedBody.data.organizationId
    },
    saveSnapshot: true,
    snapshotTarget: response
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    sameSite: 'lax',
    path: '/'
  })

  return response
}
