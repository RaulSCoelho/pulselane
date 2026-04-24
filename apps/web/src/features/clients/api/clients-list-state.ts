import type { ListClientsResponse } from '@pulselane/contracts/clients'

import type { ResilientGetResult } from '../../../http/api-result'

export type ClientsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type ClientsListState =
  | {
      status: 'ready'
      data: ListClientsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: ClientsUnavailableReason
    }

export function clientsListResultToState(result: ResilientGetResult<ListClientsResponse>): ClientsListState {
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
      reason: clientsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function clientsUnavailableReason(
  reason: Extract<ResilientGetResult<ListClientsResponse>, { status: 'unavailable' }>['reason']
): ClientsUnavailableReason {
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
