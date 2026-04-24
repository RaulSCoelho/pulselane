import { serverApi } from '@/http/server-api-client'
import { readRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { CurrentOrganizationResponse, currentOrganizationResponseSchema } from '@pulselane/contracts'
import { cache } from 'react'

export const getCurrentOrganization = cache(async (): Promise<CurrentOrganizationResponse | null> => {
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  if (!activeOrganizationId) {
    return null
  }

  const response = await serverApi<CurrentOrganizationResponse>('/api/v1/organizations/current')

  if (response.ok) {
    return currentOrganizationResponseSchema.parse(await response.json())
  }

  if ([400, 401, 403, 404].includes(response.status)) {
    return null
  }

  if (response.status === 429) {
    const snapshot = await readRequestSnapshot('/api/v1/organizations/current', currentOrganizationResponseSchema)

    if (snapshot) {
      return snapshot
    }

    return null
  }

  throw new Error(`Unable to load current organization. Status: ${response.status}`)
})
