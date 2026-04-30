import { membershipsCacheTag } from '@/features/memberships/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListMembershipsQuery,
  ListMembershipsResponse,
  listMembershipsQuerySchema,
  listMembershipsResponseSchema
} from '@pulselane/contracts/memberships'
import { cache } from 'react'

import { membershipsListResultToState, type MembershipsListState } from './memberships-list-state'

export type { MembershipsListState, MembershipsUnavailableReason } from './memberships-list-state'

function toQueryString(query: Partial<ListMembershipsQuery>) {
  const parsed = listMembershipsQuerySchema.safeParse(query)

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

  if (parsed.data.role) {
    params.set('role', parsed.data.role)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getMembershipCacheTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [membershipsCacheTag(organizationId)]
}

export const listMemberships = cache(async function listMemberships(
  query: Partial<ListMembershipsQuery>
): Promise<MembershipsListState> {
  const result = await cachedServerApiGet<ListMembershipsResponse>({
    path: `/api/v1/memberships${toQueryString(query)}`,
    schema: listMembershipsResponseSchema,
    tags: await getMembershipCacheTags(),
    revalidate: 120
  })

  return membershipsListResultToState(result)
})
