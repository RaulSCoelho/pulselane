import type { CurrentOrganizationResponse } from '@pulselane/contracts'

import { serverGetResultHasData, type ServerGetResult } from '../../../http/server-api-result'

export type CurrentOrganizationUnavailableReason =
  | 'rate_limited'
  | 'server_error'
  | 'network_error'
  | 'unexpected_response'

export type CurrentOrganizationState =
  | {
      status: 'ready'
      data: CurrentOrganizationResponse
    }
  | {
      status: 'not_selected'
    }
  | {
      status: 'unauthorized'
    }
  | {
      status: 'forbidden'
    }
  | {
      status: 'not_found'
    }
  | {
      status: 'temporarily_unavailable'
      reason: CurrentOrganizationUnavailableReason
    }

type ResolveCurrentOrganizationStateOptions = {
  activeOrganizationId: string | null
  loadCurrentOrganization: () => Promise<ServerGetResult<CurrentOrganizationResponse>>
}

export async function resolveCurrentOrganizationState({
  activeOrganizationId,
  loadCurrentOrganization
}: ResolveCurrentOrganizationStateOptions): Promise<CurrentOrganizationState> {
  if (!activeOrganizationId) {
    return { status: 'not_selected' }
  }

  return currentOrganizationResultToState(await loadCurrentOrganization())
}

export function currentOrganizationResultToState(
  result: ServerGetResult<CurrentOrganizationResponse>
): CurrentOrganizationState {
  if (serverGetResultHasData(result)) {
    return {
      status: 'ready',
      data: result.data
    }
  }

  if (result.status === 'unauthorized') {
    return { status: 'unauthorized' }
  }

  if (result.status === 'forbidden') {
    return { status: 'forbidden' }
  }

  if (result.status === 'not_found') {
    return { status: 'not_found' }
  }

  if (result.status === 'unavailable') {
    return {
      status: 'temporarily_unavailable',
      reason: currentOrganizationUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function currentOrganizationUnavailableReason(
  reason: Extract<ServerGetResult<CurrentOrganizationResponse>, { status: 'unavailable' }>['reason']
): CurrentOrganizationUnavailableReason {
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
