import { auditLogsCacheTag } from '@/features/audit-logs/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListAuditLogsQuery,
  ListAuditLogsResponse,
  listAuditLogsQuerySchema,
  listAuditLogsResponseSchema
} from '@pulselane/contracts/audit-logs'
import { cache } from 'react'

import { auditLogsListResultToState, type AuditLogsListState } from './audit-logs-list-state'

export type { AuditLogsListState, AuditLogsUnavailableReason } from './audit-logs-list-state'

function toQueryString(query: Partial<ListAuditLogsQuery>) {
  const parsed = listAuditLogsQuerySchema.safeParse(query)

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

  if (parsed.data.entityType) {
    params.set('entityType', parsed.data.entityType)
  }

  if (parsed.data.entityId) {
    params.set('entityId', parsed.data.entityId)
  }

  if (parsed.data.actorUserId) {
    params.set('actorUserId', parsed.data.actorUserId)
  }

  if (parsed.data.action) {
    params.set('action', parsed.data.action)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getAuditLogsCacheTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [auditLogsCacheTag(organizationId)]
}

export const listAuditLogs = cache(async function listAuditLogs(
  query: Partial<ListAuditLogsQuery>
): Promise<AuditLogsListState> {
  const parsed = listAuditLogsQuerySchema.safeParse(query)

  if (!parsed.success) {
    return {
      status: 'temporarily_unavailable',
      reason: 'unexpected_response'
    }
  }

  const result = await cachedServerApiGet<ListAuditLogsResponse>({
    path: `/api/v1/audit-logs${toQueryString(parsed.data)}`,
    schema: listAuditLogsResponseSchema,
    tags: await getAuditLogsCacheTags(),
    revalidate: 60
  })

  return auditLogsListResultToState(result)
})
