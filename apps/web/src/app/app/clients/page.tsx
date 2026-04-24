import { listClients } from '@/features/clients/api/server-queries'
import { ClientCreateForm } from '@/features/clients/components/client-create-form'
import { ClientFiltersForm } from '@/features/clients/components/client-filters-form'
import { ClientsEmptyState } from '@/features/clients/components/clients-empty-state'
import { ClientsTable } from '@/features/clients/components/clients-table'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { canCreateClients } from '@/lib/clients/client-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'
import Link from 'next/link'

type ClientsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentOrganization = await getCurrentOrganization()

  if (!currentOrganization) {
    return <OrganizationContextEmptyState />
  }

  const rawQuery = {
    search: readSearchParam(resolvedSearchParams, 'search'),
    status:
      readSearchParam(resolvedSearchParams, 'status') && readSearchParam(resolvedSearchParams, 'status') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'status')
        : undefined,
    cursor: readSearchParam(resolvedSearchParams, 'cursor'),
    includeArchived: readSearchParam(resolvedSearchParams, 'includeArchived'),
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listClientsQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listClientsQuerySchema.parse({ limit: '20' })
  const clients = await listClients(query)

  const hasFilters = Boolean(query.search || query.status || query.cursor || query.includeArchived)
  const allowCreate = canCreateClients(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Operational module</span>
            <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              The first real operational entity in Pulselane. Clients unlock project structure and the rest of the
              execution flow.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current role</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.currentRole}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Clients usage</p>
                <p className="mt-2 text-sm font-medium">
                  {currentOrganization.usage.clients}
                  {currentOrganization.limits.clients !== null ? ` / ${currentOrganization.limits.clients}` : ''}
                </p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Loaded now</p>
                <p className="mt-2 text-sm font-medium">{clients.items.length}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      <ClientFiltersForm
        search={query.search ?? ''}
        status={query.status ?? 'all'}
        includeArchived={Boolean(query.includeArchived)}
      />

      {allowCreate ? <ClientCreateForm /> : null}

      {clients.items.length > 0 ? (
        <ClientsTable items={clients.items} currentRole={currentOrganization.currentRole} />
      ) : (
        <ClientsEmptyState includeArchived={Boolean(query.includeArchived)} hasFilters={hasFilters} />
      )}

      {clients.meta.hasNextPage && clients.meta.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/app/clients?${new URLSearchParams({
              ...(query.search ? { search: query.search } : {}),
              ...(query.status ? { status: query.status } : {}),
              ...(query.includeArchived ? { includeArchived: 'true' } : {}),
              limit: String(query.limit),
              cursor: clients.meta.nextCursor
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
