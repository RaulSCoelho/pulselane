import type { ListProjectsResponse } from '@pulselane/contracts/projects'

import type { ServerGetResult } from '../../../http/server-api-result'

export type ProjectsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type ProjectsListState =
  | {
      status: 'ready'
      data: ListProjectsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: ProjectsUnavailableReason
    }

export function projectsListResultToState(result: ServerGetResult<ListProjectsResponse>): ProjectsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  reason: Extract<ServerGetResult<ListProjectsResponse>, { status: 'unavailable' }>['reason']
): ProjectsUnavailableReason {
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
