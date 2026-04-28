'use server'

import { invitationCacheTag, invitationsCacheTag } from '@/features/invitations/api/cache-tags'
import {
  InvitationFieldErrors,
  InvitationFormState,
  InvitationMutationState,
  initialInvitationFormState
} from '@/features/invitations/components/invitation-action-state'
import { membershipsCacheTag } from '@/features/memberships/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { INVITATIONS_PATH } from '@/lib/invitations/invitation-constants'
import { MEMBERS_PATH } from '@/lib/memberships/membership-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  CreateInvitationRequest,
  createInvitationRequestSchema,
  invitationResponseSchema
} from '@pulselane/contracts/invitations'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function getRole(value: FormDataEntryValue | null): CreateInvitationRequest['role'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'owner' || normalized === 'admin' || normalized === 'viewer') {
    return normalized
  }

  return 'member'
}

function buildInvitationFields(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    role: getRole(formData.get('role'))
  }
}

function mapInvitationFieldErrors(error: z.ZodError<CreateInvitationRequest>): InvitationFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    email: flattened.email?.[0],
    role: flattened.role?.[0]
  }
}

async function updateInvitationCacheTags(invitationId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(invitationsCacheTag(organizationId))
  updateTag(membershipsCacheTag(organizationId))

  if (invitationId) {
    updateTag(invitationCacheTag(organizationId, invitationId))
  }
}

export async function createInvitationAction(
  previousState: InvitationFormState,
  formData: FormData
): Promise<InvitationFormState> {
  const fields = buildInvitationFields(formData)

  const payload: CreateInvitationRequest = {
    email: fields.email,
    role: fields.role
  }

  const parsed = createInvitationRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid invitation data. Review the fields and try again.',
      fields,
      fieldErrors: mapInvitationFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create invitation.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const body = invitationResponseSchema.safeParse(await response.json().catch(() => null))

  await updateInvitationCacheTags(body.success ? body.data.id : undefined)
  revalidatePath(INVITATIONS_PATH)
  revalidatePath(MEMBERS_PATH)

  return {
    status: 'success',
    message: 'Invitation created successfully.',
    fields: initialInvitationFormState.fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function revokeInvitationAction(
  _previousState: InvitationMutationState,
  formData: FormData
): Promise<InvitationMutationState> {
  const invitationId = String(formData.get('invitationId') ?? '').trim()

  if (!invitationId) {
    return {
      status: 'error',
      message: 'Missing invitation id.',
      invitationId: null
    }
  }

  const response = await serverApi(`/api/v1/invitations/${invitationId}/revoke`, {
    method: 'PATCH'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to revoke invitation.'),
      invitationId: null
    }
  }

  await updateInvitationCacheTags(invitationId)
  revalidatePath(INVITATIONS_PATH)
  revalidatePath(MEMBERS_PATH)

  return {
    status: 'success',
    message: 'Invitation revoked successfully.',
    invitationId
  }
}

export async function resendInvitationAction(
  _previousState: InvitationMutationState,
  formData: FormData
): Promise<InvitationMutationState> {
  const invitationId = String(formData.get('invitationId') ?? '').trim()

  if (!invitationId) {
    return {
      status: 'error',
      message: 'Missing invitation id.',
      invitationId: null
    }
  }

  const response = await serverApi(`/api/v1/invitations/${invitationId}/resend`, {
    method: 'POST'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to resend invitation.'),
      invitationId: null
    }
  }

  await updateInvitationCacheTags(invitationId)
  revalidatePath(INVITATIONS_PATH)
  revalidatePath(MEMBERS_PATH)

  return {
    status: 'success',
    message: 'Invitation resent successfully.',
    invitationId
  }
}
