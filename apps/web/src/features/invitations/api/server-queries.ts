import { invitationsCacheTag } from '@/features/invitations/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
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

async function getInvitationCacheTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [invitationsCacheTag(organizationId)]
}

export const listInvitations = cache(async function listInvitations(
  query: Partial<ListInvitationsQuery>
): Promise<InvitationsListState> {
  const result = await cachedServerApiGet<ListInvitationsResponse>({
    path: `/api/v1/invitations${toQueryString(query)}`,
    schema: listInvitationsResponseSchema,
    tags: await getInvitationCacheTags(),
    revalidate: 120
  })

  return invitationsListResultToState(result)
})
