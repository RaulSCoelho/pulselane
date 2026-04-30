import type { ListTasksResponse } from '@pulselane/contracts/tasks'

import type { ServerGetResult } from '../../../http/server-api-result'

export type TasksUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type TasksListState =
  | {
      status: 'ready'
      data: ListTasksResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: TasksUnavailableReason
    }

export function tasksListResultToState(result: ServerGetResult<ListTasksResponse>): TasksListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
    }
  }

  if (result.status === 'unavailable') {
    return {
      status: 'temporarily_unavailable',
      reason: tasksUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function tasksUnavailableReason(
  reason: Extract<ServerGetResult<ListTasksResponse>, { status: 'unavailable' }>['reason']
): TasksUnavailableReason {
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
