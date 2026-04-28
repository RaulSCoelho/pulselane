'use server'

import { currentOrganizationCacheTag } from '@/features/organizations/api/cache-tags'
import type {
  OrganizationSettingsFieldErrors,
  OrganizationSettingsFormState
} from '@/features/organizations/components/organization-settings-form-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { ORGANIZATION_SETTINGS_PATH } from '@/lib/organizations/organization-settings-constants'
import {
  UpdateOrganizationRequest,
  currentOrganizationResponseSchema,
  updateOrganizationRequestSchema
} from '@pulselane/contracts/organizations'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function buildOrganizationSettingsFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    slug: String(formData.get('slug') ?? '').trim()
  }
}

function mapOrganizationSettingsFieldErrors(
  error: z.ZodError<UpdateOrganizationRequest>
): OrganizationSettingsFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    name: flattened.name?.[0],
    slug: flattened.slug?.[0]
  }
}

async function updateOrganizationSettingsCacheTags(organizationId?: string) {
  const resolvedOrganizationId = organizationId ?? (await getActiveOrganizationIdFromServerCookies())

  if (!resolvedOrganizationId) {
    return
  }

  updateTag(currentOrganizationCacheTag(resolvedOrganizationId))
}

export async function updateOrganizationSettingsAction(
  previousState: OrganizationSettingsFormState,
  formData: FormData
): Promise<OrganizationSettingsFormState> {
  const fields = buildOrganizationSettingsFields(formData)

  const payload: UpdateOrganizationRequest = {
    name: fields.name,
    slug: fields.slug
  }

  const parsed = updateOrganizationRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid organization data. Review the fields and try again.',
      fields,
      fieldErrors: mapOrganizationSettingsFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/organizations/current', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update organization.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const body = currentOrganizationResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Organization updated, but the response could not be validated safely.',
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateOrganizationSettingsCacheTags(body.data.organization.id)

  revalidatePath(ORGANIZATION_SETTINGS_PATH)
  revalidatePath(APP_HOME_PATH)
  revalidatePath(SELECT_ORGANIZATION_PATH)

  return {
    status: 'success',
    message: 'Organization updated successfully.',
    fields: {
      name: body.data.organization.name,
      slug: body.data.organization.slug
    },
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}
