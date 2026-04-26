import type { ListCommentActivityHistoryResponse, ListCommentsResponse } from '@pulselane/contracts/comments'

import type { ResilientGetResult } from '../../../http/api-result'

export type CommentsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type CommentsListState =
  | {
      status: 'ready'
      data: ListCommentsResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: CommentsUnavailableReason
    }

export type CommentActivityHistoryState =
  | {
      status: 'ready'
      data: ListCommentActivityHistoryResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: CommentsUnavailableReason
    }

export function commentsListResultToState(result: ResilientGetResult<ListCommentsResponse>): CommentsListState {
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
      reason: commentsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

export function commentActivityHistoryResultToState(
  result: ResilientGetResult<ListCommentActivityHistoryResponse>
): CommentActivityHistoryState {
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
      reason: commentsUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function commentsUnavailableReason(
  reason: Extract<ResilientGetResult<unknown>, { status: 'unavailable' }>['reason']
): CommentsUnavailableReason {
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
