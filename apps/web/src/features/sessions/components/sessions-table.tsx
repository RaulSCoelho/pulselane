'use client'

import { DataTableCard, StatusPill, TableEmptyState } from '@/components/ui/data-table-card'
import { formatDateTime } from '@/lib/formatters'
import { Table } from '@heroui/react'
import type { SessionResponse } from '@pulselane/contracts/auth'

type SessionsTableProps = {
  items: SessionResponse[]
}

function getSessionStatus(session: SessionResponse) {
  if (session.compromisedAt) {
    return 'compromised'
  }

  if (session.revokedAt) {
    return 'revoked'
  }

  if (!session.isActive) {
    return 'expired'
  }

  return 'active'
}

function formatUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return 'Unknown device'
  }

  return userAgent
}

export function SessionsTable({ items }: SessionsTableProps) {
  return (
    <DataTableCard
      title="Sessions list"
      description="Active and historical authentication sessions associated with your account."
      ariaLabel="Sessions list"
    >
      <Table.Header>
        <Table.Column id="device" isRowHeader>
          Device
        </Table.Column>
        <Table.Column id="ip">IP address</Table.Column>
        <Table.Column id="status">Status</Table.Column>
        <Table.Column id="created">Created</Table.Column>
        <Table.Column id="lastUsed">Last used</Table.Column>
        <Table.Column id="expires">Expires</Table.Column>
      </Table.Header>

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No sessions to display.</TableEmptyState>}>
        {session => (
          <Table.Row id={session.id} className="align-top">
            <Table.Cell>
              <div className="flex max-w-96 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{session.isCurrent ? 'Current session' : 'Other session'}</span>

                  {session.isCurrent ? <StatusPill className="px-2 py-0.5">current</StatusPill> : null}
                </div>

                <span className="line-clamp-2 text-xs text-muted">{formatUserAgent(session.userAgent)}</span>
                <span className="text-xs text-muted">Device: {session.deviceId}</span>
              </div>
            </Table.Cell>

            <Table.Cell>{session.ipAddress ?? 'Unknown'}</Table.Cell>

            <Table.Cell>
              <StatusPill>{getSessionStatus(session)}</StatusPill>
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(session.createdAt)}</Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(session.lastUsedAt)}</Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(session.expiresAt)}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </DataTableCard>
  )
}
