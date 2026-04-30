import type { ListCommentActivityHistoryResponse, ListCommentsResponse } from '@pulselane/contracts/comments'

import type { ServerGetResult } from '../../../http/server-api-result'

export type CommentsUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type CommentsListState =
  | {
      status: 'ready'
      data: ListCommentsResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: CommentsUnavailableReason
    }

export type CommentActivityHistoryState =
  | {
      status: 'ready'
      data: ListCommentActivityHistoryResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: CommentsUnavailableReason
    }

export function commentsListResultToState(result: ServerGetResult<ListCommentsResponse>): CommentsListState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  result: ServerGetResult<ListCommentActivityHistoryResponse>
): CommentActivityHistoryState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
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
  reason: Extract<ServerGetResult<unknown>, { status: 'unavailable' }>['reason']
): CommentsUnavailableReason {
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
