import type { ListTasksResponse } from '@pulselane/contracts/tasks'

import type { ResilientGetResult } from '../../../http/api-result'

export type TasksUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type TasksListState =
  | {
      status: 'ready'
      data: ListTasksResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: TasksUnavailableReason
    }

export function tasksListResultToState(result: ResilientGetResult<ListTasksResponse>): TasksListState {
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
      reason: tasksUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function tasksUnavailableReason(
  reason: Extract<ResilientGetResult<ListTasksResponse>, { status: 'unavailable' }>['reason']
): TasksUnavailableReason {
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
