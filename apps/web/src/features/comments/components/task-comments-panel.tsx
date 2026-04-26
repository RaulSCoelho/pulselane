import type { CommentsListState } from '@/features/comments/api/server-queries'
import { canCreateComments, canDeleteComments, canEditComments } from '@/lib/comments/comment-permissions'
import { Card, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import Link from 'next/link'

import { CommentCreateForm } from './comment-create-form'
import { CommentDeleteButton } from './comment-delete-button'
import { CommentEditForm } from './comment-edit-form'

type TaskCommentsPanelProps = {
  taskId: string
  state: CommentsListState
  currentRole: MembershipRole
  commentsCursor: string
  activityCursor: string
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function buildNextHref(taskId: string, commentsCursor: string, activityCursor: string, nextCursor: string) {
  const params = new URLSearchParams()

  params.set('commentsCursor', nextCursor)

  if (activityCursor) {
    params.set('activityCursor', activityCursor)
  }

  if (commentsCursor) {
    params.set('previousCommentsCursor', commentsCursor)
  }

  return `/app/tasks/${taskId}?${params.toString()}`
}

export function TaskCommentsPanel({
  taskId,
  state,
  currentRole,
  commentsCursor,
  activityCursor
}: TaskCommentsPanelProps) {
  const allowCreate = canCreateComments(currentRole)
  const allowEdit = canEditComments(currentRole)
  const allowDelete = canDeleteComments(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Comments</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Keep task decisions, blockers and execution context attached to the work item.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex flex-col gap-4 p-8">
        {allowCreate ? <CommentCreateForm taskId={taskId} /> : null}

        {state.status === 'ready' && state.freshness === 'stale' ? (
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-sm font-medium text-warning">Using last synced comments list</p>
            </Card.Content>
          </Card>
        ) : null}

        {state.status === 'temporarily_unavailable' ? (
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-sm font-medium text-danger">Comments are temporarily unavailable: {state.reason}</p>
            </Card.Content>
          </Card>
        ) : null}

        {state.status === 'ready' && state.data.items.length === 0 ? (
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-6 text-center">
              <p className="text-sm text-muted">No comments yet.</p>
            </Card.Content>
          </Card>
        ) : null}

        {state.status === 'ready'
          ? state.data.items.map(comment => (
              <Card key={comment.id} className="border border-black/5" variant="secondary">
                <Card.Content className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{comment.author.name}</p>
                      <p className="text-xs text-muted">
                        {formatDatetime(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt
                          ? ` · edited ${formatDatetime(comment.updatedAt)}`
                          : ''}
                      </p>
                    </div>

                    {comment.deletedAt ? (
                      <span className="text-xs font-medium text-danger">Deleted</span>
                    ) : (
                      <div className="flex gap-2">
                        {allowEdit ? <CommentEditForm taskId={taskId} comment={comment} /> : null}
                        {allowDelete ? <CommentDeleteButton taskId={taskId} commentId={comment.id} /> : null}
                      </div>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {comment.deletedAt ? 'This comment was deleted.' : comment.body}
                  </p>
                </Card.Content>
              </Card>
            ))
          : null}

        {state.status === 'ready' && state.data.meta.hasNextPage && state.data.meta.nextCursor ? (
          <div className="flex justify-end">
            <Link
              href={buildNextHref(taskId, commentsCursor, activityCursor, state.data.meta.nextCursor)}
              className={buttonVariants({ variant: 'outline' })}
            >
              Load more comments
            </Link>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}
