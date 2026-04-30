import { listAuditLogs } from '@/features/audit-logs/api/server-queries'
import { AuditLogsAccessDeniedState } from '@/features/audit-logs/components/audit-logs-access-denied-state'
import { AuditLogsEmptyState } from '@/features/audit-logs/components/audit-logs-empty-state'
import { AuditLogsFilterForm } from '@/features/audit-logs/components/audit-logs-filter-form'
import { AuditLogsTable } from '@/features/audit-logs/components/audit-logs-table'
import { AuditLogsUnavailableState } from '@/features/audit-logs/components/audit-logs-unavailable-state'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { canReadAuditLogs } from '@/lib/audit-logs/audit-log-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listAuditLogsQuerySchema } from '@pulselane/contracts/audit-logs'
import Link from 'next/link'

type AuditLogsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const allowRead = canReadAuditLogs(currentOrganization.currentRole)

  const rawQuery = {
    action:
      readSearchParam(resolvedSearchParams, 'action') && readSearchParam(resolvedSearchParams, 'action') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'action')
        : undefined,
    entityType: readSearchParam(resolvedSearchParams, 'entityType') || undefined,
    entityId: readSearchParam(resolvedSearchParams, 'entityId') || undefined,
    actorUserId: readSearchParam(resolvedSearchParams, 'actorUserId') || undefined,
    cursor: readSearchParam(resolvedSearchParams, 'cursor') || undefined,
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listAuditLogsQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listAuditLogsQuerySchema.parse({ limit: '20' })

  const hasFilters = Boolean(query.action || query.entityType || query.entityId || query.actorUserId || query.cursor)
  const auditLogsState = allowRead ? await listAuditLogs(query) : null
  const loadedNow =
    auditLogsState?.status === 'ready' ? auditLogsState.data.items.length : allowRead ? 'Unavailable' : 'Restricted'

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Administrative traceability
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">Audit logs</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Inspect important organization events for operational accountability, support, and security review.
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
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Organization</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.organization.name}</p>
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

      {!allowRead ? (
        <AuditLogsAccessDeniedState />
      ) : (
        <>
          <AuditLogsFilterForm
            action={query.action ?? 'all'}
            entityType={query.entityType ?? ''}
            entityId={query.entityId ?? ''}
            actorUserId={query.actorUserId ?? ''}
          />

          {auditLogsState?.status === 'ready' ? (
            auditLogsState.data.items.length > 0 ? (
              <AuditLogsTable items={auditLogsState.data.items} />
            ) : (
              <AuditLogsEmptyState hasFilters={hasFilters} />
            )
          ) : auditLogsState ? (
            <AuditLogsUnavailableState reason={auditLogsState.reason} />
          ) : null}

          {auditLogsState?.status === 'ready' &&
          auditLogsState.data.meta.hasNextPage &&
          auditLogsState.data.meta.nextCursor ? (
            <div className="flex justify-end">
              <Link
                href={`/app/audit-logs?${new URLSearchParams({
                  ...(query.action ? { action: query.action } : {}),
                  ...(query.entityType ? { entityType: query.entityType } : {}),
                  ...(query.entityId ? { entityId: query.entityId } : {}),
                  ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
                  limit: String(query.limit),
                  cursor: auditLogsState.data.meta.nextCursor
                }).toString()}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Load next page
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
