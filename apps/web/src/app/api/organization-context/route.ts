import {
  clearActiveOrganizationCookie,
  setActiveOrganizationCookie
} from '@/lib/organizations/organization-context-cookie'
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

  setActiveOrganizationCookie(response, parsedBody.data.organizationId)

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })

  clearActiveOrganizationCookie(response)

  return response
}
