import { listClients } from '@/features/clients/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { listProjects } from '@/features/projects/api/server-queries'
import { ProjectCreateForm } from '@/features/projects/components/project-create-form'
import { ProjectFiltersForm } from '@/features/projects/components/project-filters-form'
import { ProjectsEmptyState } from '@/features/projects/components/projects-empty-state'
import { ProjectsTable } from '@/features/projects/components/projects-table'
import { ProjectsUnavailableState } from '@/features/projects/components/projects-unavailable-state'
import { canCreateProjects } from '@/lib/projects/project-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'
import { listProjectsQuerySchema } from '@pulselane/contracts/projects'
import Link from 'next/link'

type ProjectsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

  const clientsQuery = listClientsQuerySchema.parse({
    limit: '100',
    includeArchived: false
  })

  const clientsState = await listClients(clientsQuery)
  const clients = clientsState.status === 'ready' ? clientsState.data.items : []

  const rawClientId = readSearchParam(resolvedSearchParams, 'clientId')
  const rawQuery = {
    search: readSearchParam(resolvedSearchParams, 'search'),
    clientId: rawClientId && rawClientId !== 'all' ? rawClientId : undefined,
    status:
      readSearchParam(resolvedSearchParams, 'status') && readSearchParam(resolvedSearchParams, 'status') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'status')
        : undefined,
    cursor: readSearchParam(resolvedSearchParams, 'cursor'),
    includeArchived: readSearchParam(resolvedSearchParams, 'includeArchived'),
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listProjectsQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listProjectsQuerySchema.parse({ limit: '20' })
  const projectsState = await listProjects(query)

  const hasFilters = Boolean(query.search || query.status || query.clientId || query.cursor || query.includeArchived)
  const allowCreate = canCreateProjects(currentOrganization.currentRole)
  const loadedNow = projectsState.status === 'ready' ? projectsState.data.items.length : 'Unavailable'

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Operational module</span>
            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Projects connect client ownership to execution. Tasks should only start after this layer is stable.
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
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Projects usage</p>
                <p className="mt-2 text-sm font-medium">
                  {currentOrganization.usage.projects}
                  {currentOrganization.limits.projects !== null ? ` / ${currentOrganization.limits.projects}` : ''}
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

      <ProjectFiltersForm
        search={query.search ?? ''}
        status={query.status ?? 'all'}
        clientId={query.clientId ?? 'all'}
        includeArchived={Boolean(query.includeArchived)}
        clients={clients}
      />

      {projectsState.status === 'ready' && projectsState.freshness === 'stale' ? (
        <Card className="border border-black/5">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">Using last synced projects list</p>
          </Card.Content>
        </Card>
      ) : null}

      {projectsState.status === 'ready' ? (
        <>
          {allowCreate && clients.length > 0 ? <ProjectCreateForm clients={clients} /> : null}

          {allowCreate && clients.length === 0 ? (
            <Card className="border border-black/5">
              <Card.Content className="flex flex-col gap-2 p-8">
                <h2 className="text-xl font-semibold tracking-tight">Create a client first</h2>
                <p className="text-sm leading-6 text-muted">
                  Projects require an active client. Create a client before starting project work.
                </p>
                <div>
                  <Link href="/app/clients" className={buttonVariants({ variant: 'outline' })}>
                    Go to clients
                  </Link>
                </div>
              </Card.Content>
            </Card>
          ) : null}

          {projectsState.data.items.length > 0 ? (
            <ProjectsTable items={projectsState.data.items} currentRole={currentOrganization.currentRole} />
          ) : (
            <ProjectsEmptyState includeArchived={Boolean(query.includeArchived)} hasFilters={hasFilters} />
          )}
        </>
      ) : (
        <ProjectsUnavailableState reason={projectsState.reason} />
      )}

      {projectsState.status === 'ready' && projectsState.data.meta.hasNextPage && projectsState.data.meta.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/app/projects?${new URLSearchParams({
              ...(query.search ? { search: query.search } : {}),
              ...(query.status ? { status: query.status } : {}),
              ...(query.clientId ? { clientId: query.clientId } : {}),
              ...(query.includeArchived ? { includeArchived: 'true' } : {}),
              limit: String(query.limit),
              cursor: projectsState.data.meta.nextCursor
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
