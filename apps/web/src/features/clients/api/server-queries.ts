import { clientCacheTag, clientsCacheTag } from '@/features/clients/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { cachedServerApiGet } from '@/http/server-api-client'
import { serverGetResultHasData, type ServerGetResult } from '@/http/server-api-result'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ClientResponse,
  clientResponseSchema,
  ListClientsQuery,
  ListClientsResponse,
  listClientsQuerySchema,
  listClientsResponseSchema
} from '@pulselane/contracts/clients'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { clientsListResultToState, type ClientsListState } from './clients-list-state'

export type { ClientsListState, ClientsUnavailableReason } from './clients-list-state'

function toQueryString(query: Partial<ListClientsQuery>) {
  const parsed = listClientsQuerySchema.safeParse(query)

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

  if (parsed.data.status) {
    params.set('status', parsed.data.status)
  }

  if (parsed.data.includeArchived) {
    params.set('includeArchived', 'true')
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getClientCacheTags(clientId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return clientId
    ? [clientsCacheTag(organizationId), clientCacheTag(organizationId, clientId)]
    : [clientsCacheTag(organizationId)]
}

function throwServerClientsError(result: ServerGetResult<unknown>, message: string): never {
  if (result.status === 'unavailable') {
    throw new Error(`${message} Status: ${result.statusCode ?? result.reason}`)
  }

  throw new Error(`${message} Status: ${result.status}`)
}

export const listClients = cache(async function listClients(
  query: Partial<ListClientsQuery>
): Promise<ClientsListState> {
  const result = await cachedServerApiGet<ListClientsResponse>({
    path: `/api/v1/clients${toQueryString(query)}`,
    schema: listClientsResponseSchema,
    tags: await getClientCacheTags(),
    revalidate: 120
  })

  return clientsListResultToState(result)
})

export const getClientById = cache(async function getClientById(clientId: string): Promise<ClientResponse> {
  const result = await cachedServerApiGet<ClientResponse>({
    path: `/api/v1/clients/${clientId}`,
    schema: clientResponseSchema,
    tags: await getClientCacheTags(clientId),
    revalidate: 120
  })

  if (result.status === 'not_found') {
    notFound()
  }

  if (serverGetResultHasData(result)) {
    return result.data
  }

  throwServerClientsError(result, 'Unable to load client.')
})

export const readErrorMessage = readApiErrorMessage
