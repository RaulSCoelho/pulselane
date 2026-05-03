import { PageHeader } from '@/components/ui/page-header'
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
import { buttonVariants } from '@heroui/react'
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administrative traceability"
        title="Audit logs"
        description="Inspect important organization events for operational accountability, support, and security review."
      />

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
