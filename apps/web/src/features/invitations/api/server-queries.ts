import { invitationsCacheTag } from '@/features/invitations/api/cache-tags'
import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListInvitationsQuery,
  ListInvitationsResponse,
  listInvitationsQuerySchema,
  listInvitationsResponseSchema
} from '@pulselane/contracts/invitations'
import { cache } from 'react'

import { invitationsListResultToState, type InvitationsListState } from './invitations-list-state'

export type { InvitationsListState, InvitationsUnavailableReason } from './invitations-list-state'

function toQueryString(query: Partial<ListInvitationsQuery>) {
  const parsed = listInvitationsQuerySchema.safeParse(query)

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

  if (parsed.data.email) {
    params.set('email', parsed.data.email)
  }

  if (parsed.data.status) {
    params.set('status', parsed.data.status)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getInvitationSnapshotTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [invitationsCacheTag(organizationId)]
}

export const listInvitations = cache(async function listInvitations(
  query: Partial<ListInvitationsQuery>
): Promise<InvitationsListState> {
  const result = await resilientGet<ListInvitationsResponse>({
    key: 'invitations.list',
    path: `/api/v1/invitations${toQueryString(query)}`,
    schema: listInvitationsResponseSchema,
    fallback: 'last-valid',
    tags: await getInvitationSnapshotTags(),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return invitationsListResultToState(result)
  }

  return invitationsListResultToState(result)
})
