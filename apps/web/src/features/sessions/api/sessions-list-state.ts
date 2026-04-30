import type { SessionListResponse } from '@pulselane/contracts/auth'

import type { ServerGetResult } from '../../../http/server-api-result'

export type SessionsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type SessionsListState =
  | {
      status: 'ready'
      data: SessionListResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: SessionsUnavailableReason
    }

export function sessionsListResultToState(result: ServerGetResult<SessionListResponse>): SessionsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  reason: Extract<ServerGetResult<SessionListResponse>, { status: 'unavailable' }>['reason']
): SessionsUnavailableReason {
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
