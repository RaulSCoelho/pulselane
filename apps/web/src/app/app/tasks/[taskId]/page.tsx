import { listCommentActivityHistory, listComments } from '@/features/comments/api/server-queries'
import { TaskActivityHistoryPanel } from '@/features/comments/components/task-activity-history-panel'
import { TaskCommentsPanel } from '@/features/comments/components/task-comments-panel'
import { listMemberships } from '@/features/memberships/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { listProjects } from '@/features/projects/api/server-queries'
import { getTaskById } from '@/features/tasks/api/server-queries'
import { TaskEditForm } from '@/features/tasks/components/task-edit-form'
import { canEditTasks } from '@/lib/tasks/task-permissions'
import { Alert, Card } from '@heroui/react'
import { listCommentActivityHistoryQuerySchema, listCommentsQuerySchema } from '@pulselane/contracts/comments'
import { listMembershipsQuerySchema } from '@pulselane/contracts/memberships'
import { listProjectsQuerySchema } from '@pulselane/contracts/projects'

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function TaskDetailPage({ params, searchParams }: TaskDetailPageProps) {
  const { taskId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const commentsCursor = readSearchParam(resolvedSearchParams, 'commentsCursor') ?? ''
  const activityCursor = readSearchParam(resolvedSearchParams, 'activityCursor') ?? ''

  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const task = await getTaskById(taskId)
  const canEdit = canEditTasks(currentOrganization.currentRole)

  const projectsState = await listProjects(
    listProjectsQuerySchema.parse({
      limit: '100',
      includeArchived: false
    })
  )

  const membershipsState = await listMemberships(
    listMembershipsQuerySchema.parse({
      limit: '100'
    })
  )

  const commentsState = await listComments(
    listCommentsQuerySchema.parse({
      taskId,
      cursor: commentsCursor || undefined,
      limit: '20'
    })
  )

  const activityHistoryState = await listCommentActivityHistory(
    listCommentActivityHistoryQuerySchema.parse({
      taskId,
      cursor: activityCursor || undefined,
      limit: '20'
    })
  )

  const projects = projectsState.status === 'ready' ? projectsState.data.items : []
  const memberships = membershipsState.status === 'ready' ? membershipsState.data.items : []

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Task record</span>
            <h1 className="font-semibold tracking-normal">{task.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Review the execution state, comments and activity history without bypassing tenant or concurrency
              safeguards.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
                <p className="mt-2 text-sm font-medium">{task.status}</p>
              </Card.Content>
            </Card>

            <Card className="border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Priority</p>
                <p className="mt-2 text-sm font-medium">{task.priority}</p>
              </Card.Content>
            </Card>

            <Card className="border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Assignee</p>
                <p className="mt-2 text-sm font-medium">{task.assignee?.name ?? 'Unassigned'}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      {!canEdit ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Read-only access</Alert.Title>
            <Alert.Description>Your role can inspect this task, but cannot edit it or add comments.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <TaskEditForm task={task} projects={projects} memberships={memberships} canEdit={canEdit} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TaskCommentsPanel
          taskId={taskId}
          state={commentsState}
          currentRole={currentOrganization.currentRole}
          commentsCursor={commentsCursor}
          activityCursor={activityCursor}
        />

        <TaskActivityHistoryPanel
          taskId={taskId}
          state={activityHistoryState}
          commentsCursor={commentsCursor}
          activityCursor={activityCursor}
        />
      </div>
    </div>
  )
}
