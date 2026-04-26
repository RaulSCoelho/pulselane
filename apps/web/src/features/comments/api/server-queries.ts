import { commentActivityHistoryCacheTag, commentsCacheTag } from '@/features/comments/api/cache-tags'
import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
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

async function getCommentsSnapshotTags(taskId: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [commentsCacheTag(organizationId, taskId)]
}

async function getActivityHistorySnapshotTags(taskId: string) {
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

  const result = await resilientGet<ListCommentsResponse>({
    key: 'comments.list',
    path: `/api/v1/comments${toCommentsQueryString(parsed.data)}`,
    schema: listCommentsResponseSchema,
    fallback: 'last-valid',
    tags: await getCommentsSnapshotTags(parsed.data.taskId),
    maxAgeSeconds: 60,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return commentsListResultToState(result)
  }

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

  const result = await resilientGet<ListCommentActivityHistoryResponse>({
    key: 'comments.activity-history',
    path: `/api/v1/comments/activity-history${toActivityHistoryQueryString(parsed.data)}`,
    schema: listCommentActivityHistoryResponseSchema,
    fallback: 'last-valid',
    tags: await getActivityHistorySnapshotTags(parsed.data.taskId),
    maxAgeSeconds: 60,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return commentActivityHistoryResultToState(result)
  }

  return commentActivityHistoryResultToState(result)
})
