import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
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

export const listClients = cache(async function listClients(
  query: Partial<ListClientsQuery>
): Promise<ListClientsResponse> {
  const response = await serverApi<ListClientsResponse>(`/api/v1/clients${toQueryString(query)}`, {
    saveSnapshot: true
  })

  if (!response.ok) {
    throw new Error(`Unable to load clients. Status: ${response.status}`)
  }

  return listClientsResponseSchema.parse(await response.json())
})

export const getClientById = cache(async function getClientById(clientId: string): Promise<ClientResponse> {
  const response = await serverApi<ClientResponse>(`/api/v1/clients/${clientId}`, {
    saveSnapshot: true
  })

  if (response.status === 404) {
    notFound()
  }

  if (!response.ok) {
    throw new Error(`Unable to load client. Status: ${response.status}`)
  }

  return clientResponseSchema.parse(await response.json())
})

export const readErrorMessage = readApiErrorMessage
