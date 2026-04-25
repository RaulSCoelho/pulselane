import type { ListProjectsResponse } from '@pulselane/contracts/projects'

import type { ResilientGetResult } from '../../../http/api-result'

export type ProjectsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type ProjectsListState =
  | {
      status: 'ready'
      data: ListProjectsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: ProjectsUnavailableReason
    }

export function projectsListResultToState(result: ResilientGetResult<ListProjectsResponse>): ProjectsListState {
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
      reason: projectsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function projectsUnavailableReason(
  reason: Extract<ResilientGetResult<ListProjectsResponse>, { status: 'unavailable' }>['reason']
): ProjectsUnavailableReason {
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
