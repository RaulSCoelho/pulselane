'use client'

import { DataTableCard, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { AuditLogMetadataBlock } from '@/features/audit-logs/components/audit-log-metadata-block'
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
    >
      <Table.Header>
        <Table.Column id="event" isRowHeader>
          Event
        </Table.Column>
        <Table.Column id="actor">Actor</Table.Column>
        <Table.Column id="entity">Entity</Table.Column>
        <Table.Column id="metadata">Metadata</Table.Column>
        <Table.Column id="created">Created</Table.Column>
      </Table.Header>

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No audit logs to display.</TableEmptyState>}>
        {auditLog => (
          <Table.Row id={auditLog.id} className="align-top">
            <Table.Cell>
              <TableIdentity primary={auditLog.action} secondary={auditLog.id} />
            </Table.Cell>

            <Table.Cell>
              <TableIdentity
                primary={auditLog.actorUser.name}
                secondary={
                  <>
                    {auditLog.actorUser.email}
                    <br />
                    {auditLog.actorUserId}
                  </>
                }
              />
            </Table.Cell>

            <Table.Cell>
              <TableIdentity primary={auditLog.entityType} secondary={auditLog.entityId} />
            </Table.Cell>

            <Table.Cell>
              <AuditLogMetadataBlock metadata={auditLog.metadata} />
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(auditLog.createdAt)}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </DataTableCard>
  )
}
