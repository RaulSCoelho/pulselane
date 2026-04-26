import type { ListMembershipsResponse } from '@pulselane/contracts/memberships'

import type { ResilientGetResult } from '../../../http/api-result'

export type MembershipsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type MembershipsListState =
  | {
      status: 'ready'
      data: ListMembershipsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: MembershipsUnavailableReason
    }

export function membershipsListResultToState(
  result: ResilientGetResult<ListMembershipsResponse>
): MembershipsListState {
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
      reason: membershipsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function membershipsUnavailableReason(
  reason: Extract<ResilientGetResult<ListMembershipsResponse>, { status: 'unavailable' }>['reason']
): MembershipsUnavailableReason {
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
