import { clientCacheTag, clientsCacheTag } from '@/features/clients/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { resilientResultHasData, type ResilientGetResult } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
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

async function getClientSnapshotTags(clientId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return clientId
    ? [clientsCacheTag(organizationId), clientCacheTag(organizationId, clientId)]
    : [clientsCacheTag(organizationId)]
}

function throwResilientClientsError(result: ResilientGetResult<unknown>, message: string): never {
  if (result.status === 'unavailable') {
    throw new Error(`${message} Status: ${result.statusCode ?? result.reason}`)
  }

  throw new Error(`${message} Status: ${result.status}`)
}

export const listClients = cache(async function listClients(
  query: Partial<ListClientsQuery>
): Promise<ListClientsResponse> {
  const result = await resilientGet<ListClientsResponse>({
    key: 'clients.list',
    path: `/api/v1/clients${toQueryString(query)}`,
    schema: listClientsResponseSchema,
    fallback: 'last-valid',
    tags: await getClientSnapshotTags(),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return result.data
  }

  throwResilientClientsError(result, 'Unable to load clients.')
})

export const getClientById = cache(async function getClientById(clientId: string): Promise<ClientResponse> {
  const result = await resilientGet<ClientResponse>({
    key: 'clients.detail',
    path: `/api/v1/clients/${clientId}`,
    schema: clientResponseSchema,
    fallback: 'last-valid',
    tags: await getClientSnapshotTags(clientId),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (result.status === 'not_found') {
    notFound()
  }

  if (resilientResultHasData(result)) {
    return result.data
  }

  throwResilientClientsError(result, 'Unable to load client.')
})

export const readErrorMessage = readApiErrorMessage
