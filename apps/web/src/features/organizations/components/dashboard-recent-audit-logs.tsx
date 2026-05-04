import { StatusPill } from '@/components/ui/data-table-card'
import { SectionCard } from '@/components/ui/section-card'
import type { AuditLogsListState } from '@/features/audit-logs/api/server-queries'
import {
  formatAuditLogActionLabel,
  formatAuditLogEntityLabel,
  getAuditLogActionTone,
  getAuditLogEventSummary
} from '@/lib/audit-logs/audit-log-action'
import { AUDIT_LOGS_PATH } from '@/lib/audit-logs/audit-log-constants'
import { formatDateTime } from '@/lib/formatters'
import { buttonVariants } from '@heroui/react'
import Link from 'next/link'

type DashboardRecentAuditLogsProps = {
  auditLogsState: AuditLogsListState | null
  canRead: boolean
}

function formatUnavailableReason(state: Exclude<AuditLogsListState, { status: 'ready' }>) {
  if (state.reason === 'rate_limited') {
    return 'Audit logs are rate limited right now.'
  }

  if (state.reason === 'network_error') {
    return 'Audit logs could not be reached.'
  }

  return 'Audit logs are temporarily unavailable.'
}

export function DashboardRecentAuditLogs({ auditLogsState, canRead }: DashboardRecentAuditLogsProps) {
  return (
    <SectionCard
      title="Recent audit logs"
      description="Latest organization events for accountability and support review."
      contentClassName="p-0 sm:p-0"
    >
      {!canRead ? (
        <div className="p-5 text-sm text-muted sm:p-6">Audit logs are available to owners and admins.</div>
      ) : auditLogsState?.status === 'ready' ? (
        auditLogsState.data.items.length > 0 ? (
          <div className="divide-y divide-separator">
            {auditLogsState.data.items.map(auditLog => (
              <div
                key={auditLog.id}
                className="grid min-w-0 gap-3 p-4 transition hover:bg-surface-secondary/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <StatusPill className="min-h-6 shrink-0 px-2 py-0.5" tone={getAuditLogActionTone(auditLog.action)}>
                    {formatAuditLogActionLabel(auditLog.action)}
                  </StatusPill>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={getAuditLogEventSummary(auditLog)}>
                      {getAuditLogEventSummary(auditLog)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {formatAuditLogEntityLabel(auditLog.entityType)} - {auditLog.entityId}
                    </p>
                  </div>
                </div>

                <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(auditLog.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted sm:p-6">No audit logs recorded yet.</div>
        )
      ) : auditLogsState ? (
        <div className="p-5 text-sm text-muted sm:p-6">{formatUnavailableReason(auditLogsState)}</div>
      ) : null}

      {canRead ? (
        <div className="flex justify-stretch border-t border-separator p-4 sm:justify-end">
          <Link
            href={AUDIT_LOGS_PATH}
            className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full sm:w-auto`}
          >
            View audit logs
          </Link>
        </div>
      ) : null}
    </SectionCard>
  )
}
