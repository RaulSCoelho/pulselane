import { currentOrganizationCacheTag } from '@/features/organizations/api/cache-tags'
import { resilientGet } from '@/http/resilient-fetch'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { CurrentOrganizationResponse, currentOrganizationResponseSchema } from '@pulselane/contracts'
import { cache } from 'react'

import { resolveCurrentOrganizationState, type CurrentOrganizationState } from './current-organization-state'

export type { CurrentOrganizationState } from './current-organization-state'

export const getCurrentOrganization = cache(async (): Promise<CurrentOrganizationState> => {
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  return resolveCurrentOrganizationState({
    activeOrganizationId,
    loadCurrentOrganization: () =>
      resilientGet<CurrentOrganizationResponse>({
        key: 'organizations.current',
        path: '/api/v1/organizations/current',
        schema: currentOrganizationResponseSchema,
        fallback: 'last-valid',
        tags: activeOrganizationId ? [currentOrganizationCacheTag(activeOrganizationId)] : [],
        maxAgeSeconds: 300,
        staleIfErrorSeconds: 3600,
        staleIfRateLimitedSeconds: 3600,
        tenantScoped: true,
        userScoped: true,
        retryPolicy: {
          maxRetries: 1,
          baseDelayMs: 250,
          maxDelayMs: 1000
        }
      })
  })
})
