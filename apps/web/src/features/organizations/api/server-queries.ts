import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { CurrentOrganizationResponse, currentOrganizationResponseSchema } from '@pulselane/contracts'
import { cache } from 'react'

export const getCurrentOrganization = cache(async (): Promise<CurrentOrganizationResponse | null> => {
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  if (!activeOrganizationId) {
    return null
  }

  const result = await resilientGet<CurrentOrganizationResponse>({
    key: 'organizations.current',
    path: '/api/v1/organizations/current',
    schema: currentOrganizationResponseSchema,
    fallback: 'last-valid',
    tags: ['organization-current'],
    maxAgeSeconds: 300,
    staleIfErrorSeconds: 3600,
    staleIfRateLimitedSeconds: 3600,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return result.data
  }

  if (['bad_request', 'unauthorized', 'forbidden', 'not_found'].includes(result.status)) {
    return null
  }

  if (result.status === 'unavailable' && result.reason === 'rate_limited_no_snapshot') {
    return null
  }

  throw new Error(
    `Unable to load current organization. Status: ${result.status === 'unavailable' ? result.statusCode : result.status}`
  )
})
