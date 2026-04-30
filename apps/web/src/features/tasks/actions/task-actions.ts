'use server'

import { taskCacheTag, tasksCacheTag } from '@/features/tasks/api/cache-tags'
import {
  ArchiveTaskState,
  TaskFieldErrors,
  TaskFormState,
  TaskFormValues,
  initialTaskFormState
} from '@/features/tasks/components/task-form-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { TASKS_PATH } from '@/lib/tasks/task-constants'
import { type TaskStatus, successResponseSchema } from '@pulselane/contracts'
import {
  CreateTaskRequest,
  TaskResponse,
  UpdateTaskRequest,
  createTaskRequestSchema,
  taskResponseSchema,
  updateTaskRequestSchema
} from '@pulselane/contracts/tasks'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function optionalString(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

function toOptionalValue(value: string): string | undefined {
  return value.length > 0 ? value : undefined
}

function toOptionalSelectValue(value: string): string | undefined {
  if (!value || value === 'all' || value === 'unassigned') {
    return undefined
  }

  return value
}

function toOptionalIsoDatetime(value: string): string | undefined {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function getStatus(value: FormDataEntryValue | null): TaskFormValues['status'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'in_progress' || normalized === 'blocked' || normalized === 'done' || normalized === 'archived') {
    return normalized
  }

  return 'todo'
}

function getPriority(value: FormDataEntryValue | null): TaskFormValues['priority'] {
  const normalized = String(value ?? '').trim()

  if (normalized === 'low' || normalized === 'high' || normalized === 'urgent') {
    return normalized
  }

  return 'medium'
}

function buildTaskFormValues(formData: FormData): TaskFormValues {
  return {
    title: String(formData.get('title') ?? '').trim(),
    projectId: String(formData.get('projectId') ?? '').trim(),
    description: optionalString(formData.get('description')),
    assigneeUserId: optionalString(formData.get('assigneeUserId')),
    status: getStatus(formData.get('status')),
    priority: getPriority(formData.get('priority')),
    blockedReason: optionalString(formData.get('blockedReason')),
    dueDate: optionalString(formData.get('dueDate'))
  }
}

function mapTaskFieldErrors(error: z.ZodError<CreateTaskRequest | UpdateTaskRequest>): TaskFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    title: flattened.title?.[0],
    projectId: flattened.projectId?.[0],
    description: flattened.description?.[0],
    assigneeUserId: flattened.assigneeUserId?.[0],
    status: flattened.status?.[0],
    priority: flattened.priority?.[0],
    blockedReason: flattened.blockedReason?.[0],
    dueDate: flattened.dueDate?.[0]
  }
}

async function updateTaskCacheTags(taskId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(tasksCacheTag(organizationId))

  if (taskId) {
    updateTag(taskCacheTag(organizationId, taskId))
  }
}

export async function createTaskAction(previousState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const fields = buildTaskFormValues(formData)

  const payload: CreateTaskRequest = {
    title: fields.title,
    projectId: fields.projectId,
    description: toOptionalValue(fields.description),
    assigneeUserId: toOptionalSelectValue(fields.assigneeUserId),
    status: fields.status,
    priority: fields.priority,
    blockedReason: toOptionalValue(fields.blockedReason),
    dueDate: toOptionalIsoDatetime(fields.dueDate)
  }

  const parsed = createTaskRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid task data. Review the fields and try again.',
      fields,
      fieldErrors: mapTaskFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create task.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateTaskCacheTags()
  revalidatePath(TASKS_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Task created successfully.',
    fields: initialTaskFormState.fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function updateTaskAction(previousState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = String(formData.get('taskId') ?? '').trim()
  const fields = buildTaskFormValues(formData)

  if (!taskId) {
    return {
      status: 'error',
      message: 'Missing task id.',
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const payload: UpdateTaskRequest = {
    title: fields.title,
    projectId: fields.projectId,
    description: toOptionalValue(fields.description),
    assigneeUserId: toOptionalSelectValue(fields.assigneeUserId),
    status: fields.status,
    priority: fields.priority,
    blockedReason: toOptionalValue(fields.blockedReason),
    dueDate: toOptionalIsoDatetime(fields.dueDate),
    expectedUpdatedAt: String(formData.get('expectedUpdatedAt') ?? '').trim()
  }

  const parsed = updateTaskRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid update payload. Refresh the page and try again.',
      fields,
      fieldErrors: mapTaskFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update task.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateTaskCacheTags(taskId)
  revalidatePath(TASKS_PATH)
  revalidatePath(`${TASKS_PATH}/${taskId}`)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Task updated successfully.',
    fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function archiveTaskAction(
  _previousState: ArchiveTaskState,
  formData: FormData
): Promise<ArchiveTaskState> {
  const taskId = String(formData.get('taskId') ?? '').trim()

  if (!taskId) {
    return {
      status: 'error',
      message: 'Missing task id.',
      archivedTaskId: null
    }
  }

  const response = await serverApi(`/api/v1/tasks/${taskId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to archive task.'),
      archivedTaskId: null
    }
  }

  const body = successResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success || !body.data.success) {
    return {
      status: 'error',
      message: 'Unable to archive task.',
      archivedTaskId: null
    }
  }

  await updateTaskCacheTags(taskId)
  revalidatePath(TASKS_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Task archived successfully.',
    archivedTaskId: taskId
  }
}

export async function updateTaskStatusAction(input: {
  taskId: string
  status: TaskStatus
  expectedUpdatedAt: string
}): Promise<{ status: 'success'; task: TaskResponse } | { status: 'error'; message: string }> {
  const taskId = input.taskId.trim()

  if (!taskId) {
    return {
      status: 'error',
      message: 'Missing task id.'
    }
  }

  const parsed = updateTaskRequestSchema.safeParse({
    status: input.status,
    expectedUpdatedAt: input.expectedUpdatedAt
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid task status update.'
    }
  }

  const response = await serverApi(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update task status.')
    }
  }

  const body = taskResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Unable to update task status.'
    }
  }

  await updateTaskCacheTags(taskId)
  revalidatePath(TASKS_PATH)
  revalidatePath(`${TASKS_PATH}/${taskId}`)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    task: body.data
  }
}
