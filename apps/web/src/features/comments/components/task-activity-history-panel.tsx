import type { CommentActivityHistoryState } from '@/features/comments/api/server-queries'
import { Card, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type TaskActivityHistoryPanelProps = {
  taskId: string
  state: CommentActivityHistoryState
  commentsCursor: string
  activityCursor: string
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function formatActorName(actor: { name: string } | null) {
  return actor?.name ?? 'System'
}

function formatMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }

  return JSON.stringify(metadata, null, 2)
}

function buildNextHref(taskId: string, commentsCursor: string, nextCursor: string) {
  const params = new URLSearchParams()

  params.set('activityCursor', nextCursor)

  if (commentsCursor) {
    params.set('commentsCursor', commentsCursor)
  }

  return `/app/tasks/${taskId}?${params.toString()}`
}

export function TaskActivityHistoryPanel({
  taskId,
  state,
  commentsCursor,
  activityCursor
}: TaskActivityHistoryPanelProps) {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Header className="flex min-w-0 flex-col gap-2 p-5 pb-0 sm:p-8 sm:pb-0">
        <Card.Title className="text-xl font-semibold tracking-normal sm:text-2xl">Activity history</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Minimal timeline combining comments and audit-log activity for this task.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex min-w-0 flex-col gap-4 p-5 sm:p-8">
        {state.status === 'temporarily_unavailable' ? (
          <Card className="border border-border" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-sm font-medium text-danger">
                Activity history is temporarily unavailable: {state.reason}
              </p>
            </Card.Content>
          </Card>
        ) : null}

        {state.status === 'ready' && state.data.items.length === 0 ? (
          <Card className="border border-border" variant="secondary">
            <Card.Content className="p-6 text-center">
              <p className="text-sm text-muted">No activity yet.</p>
            </Card.Content>
          </Card>
        ) : null}

        {state.status === 'ready'
          ? state.data.items.map(item => {
              const metadata = formatMetadata(item.metadata)

              return (
                <Card key={`${item.source}-${item.id}`} className="min-w-0 border border-border" variant="secondary">
                  <Card.Content className="flex min-w-0 flex-col gap-3 p-4">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {item.action} · {item.entityType}
                        </p>
                        <p className="text-xs text-muted">
                          {formatActorName(item.actor)} · {formatDatetime(item.occurredAt)}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {item.source}
                      </span>
                    </div>

                    {item.content ? <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p> : null}

                    {metadata ? (
                      <pre className="overflow-auto rounded-xl bg-brand-dark-background p-4 text-xs leading-5 text-brand-light-text">
                        {metadata}
                      </pre>
                    ) : null}
                  </Card.Content>
                </Card>
              )
            })
          : null}

        {state.status === 'ready' && state.data.meta.hasNextPage && state.data.meta.nextCursor ? (
          <div className="flex justify-stretch sm:justify-end">
            <Link
              href={buildNextHref(taskId, commentsCursor, state.data.meta.nextCursor)}
              className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}
            >
              Load more activity
            </Link>
          </div>
        ) : null}

        {activityCursor ? <p className="text-xs text-muted">Current activity cursor: {activityCursor}</p> : null}
      </Card.Content>
    </Card>
  )
}
