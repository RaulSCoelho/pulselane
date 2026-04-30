import { taskCacheTag, tasksCacheTag } from '@/features/tasks/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { cachedServerApiGet } from '@/http/server-api-client'
import { serverGetResultHasData, type ServerGetResult } from '@/http/server-api-result'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListTasksQuery,
  ListTasksResponse,
  TaskResponse,
  listTasksQuerySchema,
  listTasksResponseSchema,
  taskResponseSchema
} from '@pulselane/contracts/tasks'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { tasksListResultToState, type TasksListState } from './tasks-list-state'

export type { TasksListState, TasksUnavailableReason } from './tasks-list-state'

function toQueryString(query: Partial<ListTasksQuery>) {
  const parsed = listTasksQuerySchema.safeParse(query)

  if (!parsed.success) {
    return ''
  }

  const params = new URLSearchParams()

  if (parsed.data.cursor) {
    params.set('cursor', parsed.data.cursor)
  }

  if (parsed.data.limit) {
    params.set('limit', String(parsed.data.limit))
  }

  if (parsed.data.search) {
    params.set('search', parsed.data.search)
  }

  if (parsed.data.projectId) {
    params.set('projectId', parsed.data.projectId)
  }

  if (parsed.data.assigneeUserId) {
    params.set('assigneeUserId', parsed.data.assigneeUserId)
  }

  if (parsed.data.status) {
    params.set('status', parsed.data.status)
  }

  if (parsed.data.priority) {
    params.set('priority', parsed.data.priority)
  }

  if (parsed.data.overdue) {
    params.set('overdue', 'true')
  }

  if (parsed.data.dueDateFrom) {
    params.set('dueDateFrom', parsed.data.dueDateFrom)
  }

  if (parsed.data.dueDateTo) {
    params.set('dueDateTo', parsed.data.dueDateTo)
  }

  if (parsed.data.sortBy) {
    params.set('sortBy', parsed.data.sortBy)
  }

  if (parsed.data.sortDirection) {
    params.set('sortDirection', parsed.data.sortDirection)
  }

  if (parsed.data.includeArchived) {
    params.set('includeArchived', 'true')
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getTaskCacheTags(taskId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return taskId
    ? [tasksCacheTag(organizationId), taskCacheTag(organizationId, taskId)]
    : [tasksCacheTag(organizationId)]
}

function throwServerTasksError(result: ServerGetResult<unknown>, message: string): never {
  if (result.status === 'unavailable') {
    throw new Error(`${message} Status: ${result.statusCode ?? result.reason}`)
  }

  throw new Error(`${message} Status: ${result.status}`)
}

export const listTasks = cache(async function listTasks(query: Partial<ListTasksQuery>): Promise<TasksListState> {
  const result = await cachedServerApiGet<ListTasksResponse>({
    path: `/api/v1/tasks${toQueryString(query)}`,
    schema: listTasksResponseSchema,
    tags: await getTaskCacheTags(),
    revalidate: 120
  })

  return tasksListResultToState(result)
})

export const getTaskById = cache(async function getTaskById(taskId: string): Promise<TaskResponse> {
  const result = await cachedServerApiGet<TaskResponse>({
    path: `/api/v1/tasks/${taskId}`,
    schema: taskResponseSchema,
    tags: await getTaskCacheTags(taskId),
    revalidate: 120
  })

  if (result.status === 'not_found') {
    notFound()
  }

  if (serverGetResultHasData(result)) {
    return result.data
  }

  throwServerTasksError(result, 'Unable to load task.')
})

export const readErrorMessage = readApiErrorMessage
