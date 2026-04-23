import { api } from '@/http/api-client'
import {
  ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS,
  ACTIVE_ORGANIZATION_COOKIE_NAME
} from '@/lib/organizations/organization-context-constants'
import { MeResponse, meResponseSchema } from '@pulselane/contracts'
import { z } from 'zod'

const setActiveOrganizationRequestSchema = z.object({
  organizationId: z.string().trim().min(1)
})

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null)
  const parsedBody = setActiveOrganizationRequestSchema.safeParse(requestBody)

  if (!parsedBody.success) {
    return Response.json({ message: 'Invalid organization payload' }, { status: 400 })
  }

  const meResponse = await api<MeResponse>('/api/v1/auth/me')

  if (!meResponse.ok) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const me = meResponseSchema.parse(await meResponse.json())

  const isMemberOfOrganization = me.memberships.some(
    membership => membership.organization.id === parsedBody.data.organizationId
  )

  if (!isMemberOfOrganization) {
    return Response.json({ message: 'Organization not available for the current user' }, { status: 403 })
  }

  const response = Response.json({ ok: true })

  response.headers.append(
    'Set-Cookie',
    `${ACTIVE_ORGANIZATION_COOKIE_NAME}=${encodeURIComponent(parsedBody.data.organizationId)}; Max-Age=${ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS}; Path=/; SameSite=Lax`
  )

  return response
}

export async function DELETE() {
  const response = Response.json({ ok: true })

  response.headers.append('Set-Cookie', `${ACTIVE_ORGANIZATION_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`)

  return response
}
