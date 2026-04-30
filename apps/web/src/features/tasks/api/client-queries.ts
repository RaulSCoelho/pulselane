'use client'

import { buildClientQueryString, clientApiJson } from '@/http/client-resource'
import {
  type ListTasksQuery,
  type ListTasksResponse,
  listTasksQuerySchema,
  listTasksResponseSchema
} from '@pulselane/contracts/tasks'

export async function fetchTasksPage(query: Partial<ListTasksQuery>): Promise<ListTasksResponse> {
  const parsed = listTasksQuerySchema.parse(query)
  const queryString = buildClientQueryString({
    cursor: parsed.cursor,
    limit: parsed.limit,
    search: parsed.search,
    projectId: parsed.projectId,
    assigneeUserId: parsed.assigneeUserId,
    status: parsed.status,
    priority: parsed.priority,
    overdue: parsed.overdue,
    dueDateFrom: parsed.dueDateFrom,
    dueDateTo: parsed.dueDateTo,
    sortBy: parsed.sortBy,
    sortDirection: parsed.sortDirection,
    includeArchived: parsed.includeArchived
  })

  return clientApiJson({
    path: `/api/v1/tasks${queryString}`,
    schema: listTasksResponseSchema,
    fallbackMessage: 'Unable to load tasks.'
  })
}
