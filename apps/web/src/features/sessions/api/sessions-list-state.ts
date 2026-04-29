import type { SessionListResponse } from '@pulselane/contracts/auth'

import type { ResilientGetResult } from '../../../http/api-result'

export type SessionsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type SessionsListState =
  | {
      status: 'ready'
      data: SessionListResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: SessionsUnavailableReason
    }

export function sessionsListResultToState(result: ResilientGetResult<SessionListResponse>): SessionsListState {
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
      reason: sessionsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function sessionsUnavailableReason(
  reason: Extract<ResilientGetResult<SessionListResponse>, { status: 'unavailable' }>['reason']
): SessionsUnavailableReason {
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
