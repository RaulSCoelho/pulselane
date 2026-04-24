import type { CurrentOrganizationResponse } from '@pulselane/contracts'

import { resilientResultHasData, type ResilientGetResult } from '../../../http/api-result'

export type CurrentOrganizationUnavailableReason =
  | 'rate_limited'
  | 'server_error'
  | 'network_error'
  | 'unexpected_response'

export type CurrentOrganizationStaleReason = 'rate_limited' | 'server_error' | 'network_error'

export type CurrentOrganizationState =
  | {
      status: 'ready'
      data: CurrentOrganizationResponse
      freshness: 'fresh'
    }
  | {
      status: 'ready'
      data: CurrentOrganizationResponse
      freshness: 'stale'
      staleReason: CurrentOrganizationStaleReason
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
  loadCurrentOrganization: () => Promise<ResilientGetResult<CurrentOrganizationResponse>>
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
  result: ResilientGetResult<CurrentOrganizationResponse>
): CurrentOrganizationState {
  if (resilientResultHasData(result)) {
    if (result.status === 'fresh') {
      return {
        status: 'ready',
        data: result.data,
        freshness: 'fresh'
      }
    }

    return {
      status: 'ready',
      data: result.data,
      freshness: 'stale',
      staleReason: result.reason
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
  reason: Extract<ResilientGetResult<CurrentOrganizationResponse>, { status: 'unavailable' }>['reason']
): CurrentOrganizationUnavailableReason {
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
