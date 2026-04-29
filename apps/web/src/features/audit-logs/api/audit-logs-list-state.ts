import type { ListAuditLogsResponse } from '@pulselane/contracts/audit-logs'

import type { ResilientGetResult } from '../../../http/api-result'

export type AuditLogsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type AuditLogsListState =
  | {
      status: 'ready'
      data: ListAuditLogsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: AuditLogsUnavailableReason
    }

export function auditLogsListResultToState(result: ResilientGetResult<ListAuditLogsResponse>): AuditLogsListState {
  if (result.status === 'fresh') {
    return {
      status: 'ready',
      data: result.data,
      freshness: 'fresh'
    }
  }

  if (result.status === 'stale') {
    return {
      status: 'ready',
      data: result.data,
      freshness: 'stale'
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
  reason: Extract<ResilientGetResult<ListAuditLogsResponse>, { status: 'unavailable' }>['reason']
): AuditLogsUnavailableReason {
  if (reason === 'rate_limited_no_snapshot') {
    return 'rate_limited'
  }

  if (reason === 'server_error_no_snapshot') {
    return 'server_error'
  }

  if (reason === 'network_error_no_snapshot') {
    return 'network_error'
  }

  return 'unexpected_response'
}
