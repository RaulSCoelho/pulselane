import { commentActivityHistoryCacheTag, commentsCacheTag } from '@/features/comments/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListCommentActivityHistoryQuery,
  ListCommentActivityHistoryResponse,
  ListCommentsQuery,
  ListCommentsResponse,
  listCommentActivityHistoryQuerySchema,
  listCommentActivityHistoryResponseSchema,
  listCommentsQuerySchema,
  listCommentsResponseSchema
} from '@pulselane/contracts/comments'
import { cache } from 'react'

import {
  commentActivityHistoryResultToState,
  commentsListResultToState,
  type CommentActivityHistoryState,
  type CommentsListState
} from './comments-list-state'

export type { CommentActivityHistoryState, CommentsListState, CommentsUnavailableReason } from './comments-list-state'

function toCommentsQueryString(query: Partial<ListCommentsQuery>) {
  const parsed = listCommentsQuerySchema.safeParse(query)

  if (!parsed.success) {
    return ''
  }

  const params = new URLSearchParams()

  params.set('taskId', parsed.data.taskId)

  if (parsed.data.cursor) {
    params.set('cursor', parsed.data.cursor)
  }

  if (parsed.data.limit) {
    params.set('limit', String(parsed.data.limit))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function toActivityHistoryQueryString(query: Partial<ListCommentActivityHistoryQuery>) {
  const parsed = listCommentActivityHistoryQuerySchema.safeParse(query)

  if (!parsed.success) {
    return ''
  }

  const params = new URLSearchParams()

  params.set('taskId', parsed.data.taskId)

  if (parsed.data.cursor) {
    params.set('cursor', parsed.data.cursor)
  }

  if (parsed.data.limit) {
    params.set('limit', String(parsed.data.limit))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getCommentsCacheTags(taskId: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [commentsCacheTag(organizationId, taskId)]
}

async function getActivityHistoryCacheTags(taskId: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [commentActivityHistoryCacheTag(organizationId, taskId)]
}

export const listComments = cache(async function listComments(
  query: Partial<ListCommentsQuery>
): Promise<CommentsListState> {
  const parsed = listCommentsQuerySchema.safeParse(query)

  if (!parsed.success) {
    return {
      status: 'temporarily_unavailable',
      reason: 'unexpected_response'
    }
  }

  const result = await cachedServerApiGet<ListCommentsResponse>({
    path: `/api/v1/comments${toCommentsQueryString(parsed.data)}`,
    schema: listCommentsResponseSchema,
    tags: await getCommentsCacheTags(parsed.data.taskId),
    revalidate: 60
  })

  return commentsListResultToState(result)
})

export const listCommentActivityHistory = cache(async function listCommentActivityHistory(
  query: Partial<ListCommentActivityHistoryQuery>
): Promise<CommentActivityHistoryState> {
  const parsed = listCommentActivityHistoryQuerySchema.safeParse(query)

  if (!parsed.success) {
    return {
      status: 'temporarily_unavailable',
      reason: 'unexpected_response'
    }
  }

  const result = await cachedServerApiGet<ListCommentActivityHistoryResponse>({
    path: `/api/v1/comments/activity-history${toActivityHistoryQueryString(parsed.data)}`,
    schema: listCommentActivityHistoryResponseSchema,
    tags: await getActivityHistoryCacheTags(parsed.data.taskId),
    revalidate: 60
  })

  return commentActivityHistoryResultToState(result)
})
