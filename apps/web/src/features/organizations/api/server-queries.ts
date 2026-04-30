import { currentOrganizationCacheTag } from '@/features/organizations/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { currentOrganizationResponseSchema } from '@pulselane/contracts'
import { cache } from 'react'

import { resolveCurrentOrganizationState, type CurrentOrganizationState } from './current-organization-state'

export type { CurrentOrganizationState } from './current-organization-state'

export const getCurrentOrganization = cache(async (): Promise<CurrentOrganizationState> => {
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  return resolveCurrentOrganizationState({
    activeOrganizationId,
    loadCurrentOrganization: () =>
      cachedServerApiGet({
        path: '/api/v1/organizations/current',
        schema: currentOrganizationResponseSchema,
        tags: activeOrganizationId ? [currentOrganizationCacheTag(activeOrganizationId)] : [],
        revalidate: 300
      })
  })
})
