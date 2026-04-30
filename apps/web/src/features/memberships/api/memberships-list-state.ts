import type { ListMembershipsResponse } from '@pulselane/contracts/memberships'

import type { ServerGetResult } from '../../../http/server-api-result'

export type MembershipsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type MembershipsListState =
  | {
      status: 'ready'
      data: ListMembershipsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: MembershipsUnavailableReason
    }

export function membershipsListResultToState(result: ServerGetResult<ListMembershipsResponse>): MembershipsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
    }
  }

  if (result.status === 'unavailable') {
    return {
      status: 'temporarily_unavailable',
      reason: membershipsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function membershipsUnavailableReason(
  reason: Extract<ServerGetResult<ListMembershipsResponse>, { status: 'unavailable' }>['reason']
): MembershipsUnavailableReason {
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
