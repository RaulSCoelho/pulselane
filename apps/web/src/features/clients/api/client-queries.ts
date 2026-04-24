'use client'

import { createApiHttpError } from '@/http/api-error'
import { clientApi } from '@/http/client-api-client'
import {
  ListClientsQuery,
  ListClientsResponse,
  listClientsQuerySchema,
  listClientsResponseSchema
} from '@pulselane/contracts/clients'
import { queryOptions } from '@tanstack/react-query'

function toQueryString(query: Partial<ListClientsQuery>) {
  const parsed = listClientsQuerySchema.safeParse(query)

  if (!parsed.success) {
    return ''
  }

  const params = new URLSearchParams()

  if (parsed.data.cursor) params.set('cursor', parsed.data.cursor)
  if (parsed.data.limit) params.set('limit', String(parsed.data.limit))
  if (parsed.data.search) params.set('search', parsed.data.search)
  if (parsed.data.status) params.set('status', parsed.data.status)
  if (parsed.data.includeArchived) params.set('includeArchived', 'true')

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function clientsQueryOptions(query: Partial<ListClientsQuery> = {}) {
  return queryOptions({
    queryKey: ['clients', query],
    queryFn: async (): Promise<ListClientsResponse> => {
      const response = await clientApi<ListClientsResponse>(`/api/v1/clients${toQueryString(query)}`)

      if (!response.ok) {
        throw await createApiHttpError(response, `Unable to load clients. Status: ${response.status}`)
      }

      return listClientsResponseSchema.parse(await response.json())
    }
  })
}
