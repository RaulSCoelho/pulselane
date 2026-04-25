'use server'

import { projectCacheTag, projectsCacheTag } from '@/features/projects/api/cache-tags'
import {
  ArchiveProjectState,
  ProjectFieldErrors,
  ProjectFormState,
  ProjectFormValues,
  initialProjectFormState
} from '@/features/projects/components/project-form-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { successResponseSchema } from '@pulselane/contracts'
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  createProjectRequestSchema,
  updateProjectRequestSchema
} from '@pulselane/contracts/projects'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function optionalString(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

function getStatus(value: FormDataEntryValue | null): ProjectFormValues['status'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'on_hold' || normalized === 'completed' || normalized === 'archived') {
    return normalized
  }

  return 'active'
}

function toOptionalValue(value: string): string | undefined {
  return value.length > 0 ? value : undefined
}

function buildProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    name: String(formData.get('name') ?? '').trim(),
    clientId: String(formData.get('clientId') ?? '').trim(),
    description: optionalString(formData.get('description')),
    status: getStatus(formData.get('status'))
  }
}

function mapProjectFieldErrors(error: z.ZodError<CreateProjectRequest | UpdateProjectRequest>): ProjectFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    name: flattened.name?.[0],
    clientId: flattened.clientId?.[0],
    description: flattened.description?.[0],
    status: flattened.status?.[0]
  }
}

async function updateProjectCacheTags(projectId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(projectsCacheTag(organizationId))

  if (projectId) {
    updateTag(projectCacheTag(organizationId, projectId))
  }
}

export async function createProjectAction(
  previousState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const fields = buildProjectFormValues(formData)
  const payload: CreateProjectRequest = {
    name: fields.name,
    clientId: fields.clientId,
    description: toOptionalValue(fields.description),
    status: fields.status as CreateProjectRequest['status']
  }

  const parsed = createProjectRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid project data. Review the fields and try again.',
      fields,
      fieldErrors: mapProjectFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create project.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateProjectCacheTags()
  revalidatePath(PROJECTS_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Project created successfully.',
    fields: initialProjectFormState.fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function updateProjectAction(
  previousState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const projectId = String(formData.get('projectId') ?? '').trim()
  const fields = buildProjectFormValues(formData)

  if (!projectId) {
    return {
      status: 'error',
      message: 'Missing project id.',
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const payload: UpdateProjectRequest = {
    name: fields.name,
    clientId: fields.clientId,
    description: toOptionalValue(fields.description),
    status: fields.status as UpdateProjectRequest['status'],
    expectedUpdatedAt: String(formData.get('expectedUpdatedAt') ?? '').trim()
  }

  const parsed = updateProjectRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid update payload. Refresh the page and try again.',
      fields,
      fieldErrors: mapProjectFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi(`/api/v1/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update project.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateProjectCacheTags(projectId)
  revalidatePath(PROJECTS_PATH)
  revalidatePath(`${PROJECTS_PATH}/${projectId}`)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Project updated successfully.',
    fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function archiveProjectAction(
  _previousState: ArchiveProjectState,
  formData: FormData
): Promise<ArchiveProjectState> {
  const projectId = String(formData.get('projectId') ?? '').trim()

  if (!projectId) {
    return {
      status: 'error',
      message: 'Missing project id.',
      archivedProjectId: null
    }
  }

  const response = await serverApi(`/api/v1/projects/${projectId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to archive project.'),
      archivedProjectId: null
    }
  }

  const body = successResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success || !body.data.success) {
    return {
      status: 'error',
      message: 'Unable to archive project.',
      archivedProjectId: null
    }
  }

  await updateProjectCacheTags(projectId)
  revalidatePath(PROJECTS_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Project archived successfully.',
    archivedProjectId: projectId
  }
}
