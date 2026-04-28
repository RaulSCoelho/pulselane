'use server'

import { invitationCacheTag, invitationsCacheTag } from '@/features/invitations/api/cache-tags'
import type { InvitationAcceptFormState } from '@/features/invitations/components/invitation-accept-state'
import { membershipsCacheTag } from '@/features/memberships/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { INVITATIONS_PATH } from '@/lib/invitations/invitation-constants'
import { MEMBERS_PATH } from '@/lib/memberships/membership-constants'
import { SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { acceptInvitationRequestSchema, invitationResponseSchema } from '@pulselane/contracts/invitations'
import { revalidatePath, updateTag } from 'next/cache'

export async function acceptInvitationAction(
  _previousState: InvitationAcceptFormState,
  formData: FormData
): Promise<InvitationAcceptFormState> {
  const token = String(formData.get('token') ?? '').trim()

  const parsed = acceptInvitationRequestSchema.safeParse({
    token
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid invitation token.',
      acceptedOrganizationId: null
    }
  }

  const response = await serverApi('/api/v1/invitations/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(
        response,
        'Unable to accept invitation. Sign in with the invited email and try again.'
      ),
      acceptedOrganizationId: null
    }
  }

  const body = invitationResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Invitation accepted, but the response could not be validated safely.',
      acceptedOrganizationId: null
    }
  }

  updateTag(invitationsCacheTag(body.data.organizationId))
  updateTag(invitationCacheTag(body.data.organizationId, body.data.id))
  updateTag(membershipsCacheTag(body.data.organizationId))

  revalidatePath(INVITATIONS_PATH)
  revalidatePath(MEMBERS_PATH)
  revalidatePath(SELECT_ORGANIZATION_PATH)

  return {
    status: 'success',
    message: 'Invitation accepted successfully.',
    acceptedOrganizationId: body.data.organizationId
  }
}
