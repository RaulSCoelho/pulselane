import type { ListClientsResponse } from '@pulselane/contracts/clients'

import type { ServerGetResult } from '../../../http/server-api-result'

export type ClientsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type ClientsListState =
  | {
      status: 'ready'
      data: ListClientsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: ClientsUnavailableReason
    }

export function clientsListResultToState(result: ServerGetResult<ListClientsResponse>): ClientsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  reason: Extract<ServerGetResult<ListClientsResponse>, { status: 'unavailable' }>['reason']
): ClientsUnavailableReason {
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
