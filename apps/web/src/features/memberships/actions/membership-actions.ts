'use server'

import { membershipCacheTag, membershipsCacheTag } from '@/features/memberships/api/cache-tags'
import {
  MembershipRoleFieldErrors,
  MembershipRoleFormState,
  RemoveMembershipState
} from '@/features/memberships/components/membership-action-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { successResponseSchema } from '@pulselane/contracts'
import { UpdateMembershipRoleRequest, updateMembershipRoleRequestSchema } from '@pulselane/contracts/memberships'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function getRole(value: FormDataEntryValue | null): UpdateMembershipRoleRequest['role'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'owner' || normalized === 'admin' || normalized === 'member') {
    return normalized
  }

  return 'viewer'
}

function mapMembershipRoleFieldErrors(error: z.ZodError<UpdateMembershipRoleRequest>): MembershipRoleFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    role: flattened.role?.[0]
  }
}

async function updateMembershipCacheTags(membershipId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(membershipsCacheTag(organizationId))

  if (membershipId) {
    updateTag(membershipCacheTag(organizationId, membershipId))
  }
}

export async function updateMembershipRoleAction(
  previousState: MembershipRoleFormState,
  formData: FormData
): Promise<MembershipRoleFormState> {
  const membershipId = String(formData.get('membershipId') ?? '').trim()
  const role = getRole(formData.get('role'))

  if (!membershipId) {
    return {
      status: 'error',
      message: 'Missing membership id.',
      fields: {
        role
      },
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const payload: UpdateMembershipRoleRequest = {
    role
  }

  const parsed = updateMembershipRoleRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid role. Review the field and try again.',
      fields: {
        role
      },
      fieldErrors: mapMembershipRoleFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi(`/api/v1/memberships/${membershipId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update member role.'),
      fields: {
        role
      },
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateMembershipCacheTags(membershipId)
  revalidatePath('/app/members')
  revalidatePath('/app/tasks')

  return {
    status: 'success',
    message: 'Member role updated successfully.',
    fields: {
      role
    },
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function removeMembershipAction(
  _previousState: RemoveMembershipState,
  formData: FormData
): Promise<RemoveMembershipState> {
  const membershipId = String(formData.get('membershipId') ?? '').trim()

  if (!membershipId) {
    return {
      status: 'error',
      message: 'Missing membership id.',
      removedMembershipId: null
    }
  }

  const response = await serverApi(`/api/v1/memberships/${membershipId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to remove member.'),
      removedMembershipId: null
    }
  }

  const body = successResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success || !body.data.success) {
    return {
      status: 'error',
      message: 'Unable to remove member.',
      removedMembershipId: null
    }
  }

  await updateMembershipCacheTags(membershipId)
  revalidatePath('/app/members')
  revalidatePath('/app/tasks')

  return {
    status: 'success',
    message: 'Member removed successfully.',
    removedMembershipId: membershipId
  }
}
