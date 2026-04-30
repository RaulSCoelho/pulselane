import { listMemberships } from '@/features/memberships/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { listProjects } from '@/features/projects/api/server-queries'
import { listTasks } from '@/features/tasks/api/server-queries'
import { TaskCreateForm } from '@/features/tasks/components/task-create-form'
import { TaskFiltersForm } from '@/features/tasks/components/task-filters-form'
import { TasksEmptyState } from '@/features/tasks/components/tasks-empty-state'
import { TasksTable } from '@/features/tasks/components/tasks-table'
import { TasksUnavailableState } from '@/features/tasks/components/tasks-unavailable-state'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { canCreateTasks } from '@/lib/tasks/task-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listMembershipsQuerySchema } from '@pulselane/contracts/memberships'
import { listProjectsQuerySchema } from '@pulselane/contracts/projects'
import { listTasksQuerySchema } from '@pulselane/contracts/tasks'
import Link from 'next/link'

type TasksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

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

  const projects = projectsState.status === 'ready' ? projectsState.data.items : []
  const memberships = membershipsState.status === 'ready' ? membershipsState.data.items : []

  const rawProjectId = readSearchParam(resolvedSearchParams, 'projectId')
  const rawAssigneeUserId = readSearchParam(resolvedSearchParams, 'assigneeUserId')

  const rawQuery = {
    search: readSearchParam(resolvedSearchParams, 'search'),
    projectId: rawProjectId && rawProjectId !== 'all' ? rawProjectId : undefined,
    assigneeUserId: rawAssigneeUserId && rawAssigneeUserId !== 'all' ? rawAssigneeUserId : undefined,
    status:
      readSearchParam(resolvedSearchParams, 'status') && readSearchParam(resolvedSearchParams, 'status') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'status')
        : undefined,
    priority:
      readSearchParam(resolvedSearchParams, 'priority') && readSearchParam(resolvedSearchParams, 'priority') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'priority')
        : undefined,
    overdue: readSearchParam(resolvedSearchParams, 'overdue'),
    cursor: readSearchParam(resolvedSearchParams, 'cursor'),
    includeArchived: readSearchParam(resolvedSearchParams, 'includeArchived'),
    sortBy: readSearchParam(resolvedSearchParams, 'sortBy') ?? 'created_at',
    sortDirection: readSearchParam(resolvedSearchParams, 'sortDirection') ?? 'desc',
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listTasksQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listTasksQuerySchema.parse({ limit: '20' })
  const tasksState = await listTasks(query)

  const hasFilters = Boolean(
    query.search ||
      query.status ||
      query.priority ||
      query.projectId ||
      query.assigneeUserId ||
      query.overdue ||
      query.cursor ||
      query.includeArchived
  )

  const allowCreate = canCreateTasks(currentOrganization.currentRole)
  const loadedNow = tasksState.status === 'ready' ? tasksState.data.items.length : 'Unavailable'

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Operational module</span>
            <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Tasks are the daily execution layer of Pulselane, scoped by project, assignee, priority and status.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current role</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.currentRole}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tasks usage</p>
                <p className="mt-2 text-sm font-medium">
                  {currentOrganization.usage.activeTasks}
                  {currentOrganization.limits.activeTasks !== null
                    ? ` / ${currentOrganization.limits.activeTasks}`
                    : ''}
                </p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Loaded now</p>
                <p className="mt-2 text-sm font-medium">{loadedNow}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      <TaskFiltersForm
        search={query.search ?? ''}
        projectId={query.projectId ?? 'all'}
        assigneeUserId={query.assigneeUserId ?? 'all'}
        status={query.status ?? 'all'}
        priority={query.priority ?? 'all'}
        overdue={Boolean(query.overdue)}
        includeArchived={Boolean(query.includeArchived)}
        sortBy={query.sortBy}
        sortDirection={query.sortDirection}
        projects={projects}
        memberships={memberships}
      />

      {tasksState.status === 'ready' ? (
        <>
          {allowCreate && projects.length > 0 ? <TaskCreateForm projects={projects} memberships={memberships} /> : null}

          {allowCreate && projects.length === 0 ? (
            <Card className="border border-black/5">
              <Card.Content className="flex flex-col gap-2 p-8">
                <h2 className="text-xl font-semibold tracking-tight">Create a project first</h2>
                <p className="text-sm leading-6 text-muted">
                  Tasks require an active project. Create a project before starting operational execution.
                </p>
                <div>
                  <Link href={PROJECTS_PATH} className={buttonVariants({ variant: 'outline' })}>
                    Go to projects
                  </Link>
                </div>
              </Card.Content>
            </Card>
          ) : null}

          {tasksState.data.items.length > 0 ? (
            <TasksTable items={tasksState.data.items} currentRole={currentOrganization.currentRole} />
          ) : (
            <TasksEmptyState includeArchived={Boolean(query.includeArchived)} hasFilters={hasFilters} />
          )}
        </>
      ) : (
        <TasksUnavailableState reason={tasksState.reason} />
      )}

      {tasksState.status === 'ready' && tasksState.data.meta.hasNextPage && tasksState.data.meta.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/app/tasks?${new URLSearchParams({
              ...(query.search ? { search: query.search } : {}),
              ...(query.projectId ? { projectId: query.projectId } : {}),
              ...(query.assigneeUserId ? { assigneeUserId: query.assigneeUserId } : {}),
              ...(query.status ? { status: query.status } : {}),
              ...(query.priority ? { priority: query.priority } : {}),
              ...(query.overdue ? { overdue: 'true' } : {}),
              ...(query.includeArchived ? { includeArchived: 'true' } : {}),
              sortBy: query.sortBy,
              sortDirection: query.sortDirection,
              limit: String(query.limit),
              cursor: tasksState.data.meta.nextCursor
            }).toString()}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Load next page
          </Link>
        </div>
      ) : null}
    </div>
  )
}
