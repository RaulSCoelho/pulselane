import type { ListAuditLogsResponse } from '@pulselane/contracts/audit-logs'

import type { ServerGetResult } from '../../../http/server-api-result'

export type AuditLogsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type AuditLogsListState =
  | {
      status: 'ready'
      data: ListAuditLogsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: AuditLogsUnavailableReason
    }

export function auditLogsListResultToState(result: ServerGetResult<ListAuditLogsResponse>): AuditLogsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
    }
  }

  if (result.status === 'unavailable') {
    return {
      status: 'temporarily_unavailable',
      reason: auditLogsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function auditLogsUnavailableReason(
  reason: Extract<ServerGetResult<ListAuditLogsResponse>, { status: 'unavailable' }>['reason']
): AuditLogsUnavailableReason {
  if (reason === 'rate_limited') {
    return 'rate_limited'
  }

  if (reason === 'server_error') {
    return 'server_error'
  }

  if (reason === 'network_error') {
    return 'network_error'
  }

  return 'unexpected_response'
}
