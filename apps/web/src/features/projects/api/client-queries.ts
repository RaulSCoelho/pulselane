'use client'

import { buildClientQueryString, clientApiJson } from '@/http/client-resource'
import {
  type ListProjectsQuery,
  type ListProjectsResponse,
  listProjectsQuerySchema,
  listProjectsResponseSchema
} from '@pulselane/contracts/projects'

export async function fetchProjectsPage(query: Partial<ListProjectsQuery>): Promise<ListProjectsResponse> {
  const parsed = listProjectsQuerySchema.parse(query)
  const queryString = buildClientQueryString({
    cursor: parsed.cursor,
    limit: parsed.limit,
    search: parsed.search,
    clientId: parsed.clientId,
    status: parsed.status,
    includeArchived: parsed.includeArchived
  })

  return clientApiJson({
    path: `/api/v1/projects${queryString}`,
    schema: listProjectsResponseSchema,
    fallbackMessage: 'Unable to load projects.'
  })
}
