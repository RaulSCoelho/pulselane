import type { ListInvitationsResponse } from '@pulselane/contracts/invitations'

import type { ServerGetResult } from '../../../http/server-api-result'

export type InvitationsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type InvitationsListState =
  | {
      status: 'ready'
      data: ListInvitationsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: InvitationsUnavailableReason
    }

export function invitationsListResultToState(result: ServerGetResult<ListInvitationsResponse>): InvitationsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  reason: Extract<ServerGetResult<ListInvitationsResponse>, { status: 'unavailable' }>['reason']
): InvitationsUnavailableReason {
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
