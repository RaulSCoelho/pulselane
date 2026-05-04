'use client'

import { DataTableCard, StatusPill, TableEmptyState } from '@/components/ui/data-table-card'
import { AuditLogMetadataBlock } from '@/features/audit-logs/components/audit-log-metadata-block'
import {
  formatAuditLogActionLabel,
  formatAuditLogEntityLabel,
  getAuditLogActionTone,
  getAuditLogEventSummary
} from '@/lib/audit-logs/audit-log-action'
import { formatDateTime } from '@/lib/formatters'
import { Table } from '@heroui/react'
import type { AuditLogResponse } from '@pulselane/contracts/audit-logs'

type AuditLogsTableProps = {
  items: AuditLogResponse[]
}

export function AuditLogsTable({ items }: AuditLogsTableProps) {
  return (
    <DataTableCard
      title="Audit history"
      description="Read-only trace of important organization events recorded by the backend."
      ariaLabel="Audit logs list"
      minTableWidthClassName="min-w-190"
    >
      <Table.Header>
        <Table.Column id="event" isRowHeader>
          Event
        </Table.Column>
        <Table.Column id="entity">Entity</Table.Column>
        <Table.Column id="metadata">Metadata</Table.Column>
        <Table.Column id="created">Created</Table.Column>
      </Table.Header>

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No audit logs to display.</TableEmptyState>}>
        {auditLog => (
          <Table.Row id={auditLog.id} className="align-middle transition hover:bg-surface-secondary/70">
            <Table.Cell className="max-w-150 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <StatusPill className="min-h-6 shrink-0 px-2 py-0.5" tone={getAuditLogActionTone(auditLog.action)}>
                  {formatAuditLogActionLabel(auditLog.action)}
                </StatusPill>
                <span className="truncate text-sm leading-5 text-foreground" title={getAuditLogEventSummary(auditLog)}>
                  {getAuditLogEventSummary(auditLog)}
                </span>
              </div>
            </Table.Cell>

            <Table.Cell className="py-2">
              <div className="flex max-w-56 min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm font-medium">{formatAuditLogEntityLabel(auditLog.entityType)}</span>
                <code className="truncate rounded-md bg-surface-secondary px-1.5 py-0.5 text-xs text-muted">
                  {auditLog.entityId}
                </code>
              </div>
            </Table.Cell>

            <Table.Cell className="py-2">
              <AuditLogMetadataBlock metadata={auditLog.metadata} />
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap py-2 text-sm text-muted">
              {formatDateTime(auditLog.createdAt)}
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </DataTableCard>
  )
}
