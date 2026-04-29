'use client'

import { AuditLogMetadataBlock } from '@/features/audit-logs/components/audit-log-metadata-block'
import { Card, Table } from '@heroui/react'
import type { AuditLogResponse } from '@pulselane/contracts/audit-logs'

type AuditLogsTableProps = {
  items: AuditLogResponse[]
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function AuditLogsTable({ items }: AuditLogsTableProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Audit history</Card.Title>
        <Card.Description className="text-sm text-muted">
          Read-only trace of important organization events recorded by the backend.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Audit logs list">
              <Table.Header>
                <Table.Column id="event" isRowHeader>
                  Event
                </Table.Column>
                <Table.Column id="actor">Actor</Table.Column>
                <Table.Column id="entity">Entity</Table.Column>
                <Table.Column id="metadata">Metadata</Table.Column>
                <Table.Column id="created">Created</Table.Column>
              </Table.Header>

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No audit logs to display.</span>
                )}
              >
                {auditLog => (
                  <Table.Row id={auditLog.id} className="align-top">
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{auditLog.action}</span>
                        <span className="text-xs text-muted">{auditLog.id}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{auditLog.actorUser.name}</span>
                        <span className="text-xs text-muted">{auditLog.actorUser.email}</span>
                        <span className="text-xs text-muted">{auditLog.actorUserId}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{auditLog.entityType}</span>
                        <span className="text-xs text-muted">{auditLog.entityId}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <AuditLogMetadataBlock metadata={auditLog.metadata} />
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(auditLog.createdAt)}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card.Content>
    </Card>
  )
}
