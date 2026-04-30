'use client'

import { buildClientQueryString, clientApiJson } from '@/http/client-resource'
import {
  type ListClientsQuery,
  type ListClientsResponse,
  listClientsQuerySchema,
  listClientsResponseSchema
} from '@pulselane/contracts/clients'

export async function fetchClientsPage(query: Partial<ListClientsQuery>): Promise<ListClientsResponse> {
  const parsed = listClientsQuerySchema.parse(query)
  const queryString = buildClientQueryString({
    cursor: parsed.cursor,
    limit: parsed.limit,
    search: parsed.search,
    status: parsed.status,
    includeArchived: parsed.includeArchived
  })

  return clientApiJson({
    path: `/api/v1/clients${queryString}`,
    schema: listClientsResponseSchema,
    fallbackMessage: 'Unable to load clients.'
  })
}
