'use server'

import { clientsCacheTag, clientCacheTag } from '@/features/clients/api/cache-tags'
import {
  ArchiveClientState,
  ClientFieldErrors,
  ClientFormValues,
  ClientFormState,
  initialClientFormState
} from '@/features/clients/components/client-form-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { type ClientStatus, successResponseSchema } from '@pulselane/contracts'
import {
  ClientResponse,
  createClientRequestSchema,
  clientResponseSchema,
  type CreateClientRequest,
  updateClientRequestSchema,
  type UpdateClientRequest
} from '@pulselane/contracts/clients'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function optionalString(value: FormDataEntryValue | null): string {
  const normalized = String(value ?? '').trim()
  return normalized
}

function getStatus(value: FormDataEntryValue | null): ClientFormValues['status'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'inactive' || normalized === 'archived') {
    return normalized
  }

  return 'active'
}

function toOptionalValue(value: string): string | undefined {
  return value.length > 0 ? value : undefined
}

function buildClientFormValues(formData: FormData): ClientFormValues {
  return {
    name: String(formData.get('name') ?? '').trim(),
    email: optionalString(formData.get('email')),
    companyName: optionalString(formData.get('companyName')),
    status: getStatus(formData.get('status'))
  }
}

function mapClientFieldErrors(error: z.ZodError<CreateClientRequest | UpdateClientRequest>): ClientFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    name: flattened.name?.[0],
    email: flattened.email?.[0],
    companyName: flattened.companyName?.[0],
    status: flattened.status?.[0]
  }
}

async function updateClientCacheTags(clientId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(clientsCacheTag(organizationId))

  if (clientId) {
    updateTag(clientCacheTag(organizationId, clientId))
  }
}

export async function createClientAction(previousState: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const fields = buildClientFormValues(formData)
  const payload: CreateClientRequest = {
    name: fields.name,
    email: toOptionalValue(fields.email),
    companyName: toOptionalValue(fields.companyName),
    status: fields.status as CreateClientRequest['status']
  }

  const parsed = createClientRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid client data. Review the fields and try again.',
      fields,
      fieldErrors: mapClientFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create client.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateClientCacheTags()
  revalidatePath('/app/clients')
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Client created successfully.',
    fields: initialClientFormState.fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function updateClientAction(previousState: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const clientId = String(formData.get('clientId') ?? '').trim()
  const fields = buildClientFormValues(formData)

  if (!clientId) {
    return {
      status: 'error',
      message: 'Missing client id.',
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const payload: UpdateClientRequest = {
    name: fields.name,
    email: toOptionalValue(fields.email),
    companyName: toOptionalValue(fields.companyName),
    status: fields.status as UpdateClientRequest['status'],
    expectedUpdatedAt: String(formData.get('expectedUpdatedAt') ?? '').trim()
  }

  const parsed = updateClientRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid update payload. Refresh the page and try again.',
      fields,
      fieldErrors: mapClientFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update client.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateClientCacheTags(clientId)
  revalidatePath('/app/clients')
  revalidatePath(`/app/clients/${clientId}`)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Client updated successfully.',
    fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function archiveClientAction(
  _previousState: ArchiveClientState,
  formData: FormData
): Promise<ArchiveClientState> {
  const clientId = String(formData.get('clientId') ?? '').trim()

  if (!clientId) {
    return {
      status: 'error',
      message: 'Missing client id.',
      archivedClientId: null
    }
  }

  const response = await serverApi(`/api/v1/clients/${clientId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to archive client.'),
      archivedClientId: null
    }
  }

  const body = successResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success || !body.data.success) {
    return {
      status: 'error',
      message: 'Unable to archive client.',
      archivedClientId: null
    }
  }

  await updateClientCacheTags(clientId)
  revalidatePath('/app/clients')
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Client archived successfully.',
    archivedClientId: clientId
  }
}

export async function updateClientStatusAction(input: {
  clientId: string
  status: ClientStatus
  expectedUpdatedAt: string
}): Promise<{ status: 'success'; client: ClientResponse } | { status: 'error'; message: string }> {
  const clientId = input.clientId.trim()

  if (!clientId) {
    return {
      status: 'error',
      message: 'Missing client id.'
    }
  }

  const parsed = updateClientRequestSchema.safeParse({
    status: input.status,
    expectedUpdatedAt: input.expectedUpdatedAt
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid client status update.'
    }
  }

  const response = await serverApi(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update client status.')
    }
  }

  const body = clientResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Unable to update client status.'
    }
  }

  await updateClientCacheTags(clientId)
  revalidatePath('/app/clients')
  revalidatePath(`/app/clients/${clientId}`)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    client: body.data
  }
}
