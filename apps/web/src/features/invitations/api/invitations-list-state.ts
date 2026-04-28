import type { ListInvitationsResponse } from '@pulselane/contracts/invitations'

import type { ResilientGetResult } from '../../../http/api-result'

export type InvitationsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type InvitationsListState =
  | {
      status: 'ready'
      data: ListInvitationsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: InvitationsUnavailableReason
    }

export function invitationsListResultToState(
  result: ResilientGetResult<ListInvitationsResponse>
): InvitationsListState {
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
      reason: invitationsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function invitationsUnavailableReason(
  reason: Extract<ResilientGetResult<ListInvitationsResponse>, { status: 'unavailable' }>['reason']
): InvitationsUnavailableReason {
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
