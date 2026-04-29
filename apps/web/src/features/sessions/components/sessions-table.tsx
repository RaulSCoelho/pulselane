'use client'

import { Card, Table } from '@heroui/react'
import type { SessionResponse } from '@pulselane/contracts/auth'

type SessionsTableProps = {
  items: SessionResponse[]
}

function formatDatetime(value: string | null) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
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
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Sessions list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Active and historical authentication sessions associated with your account.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Sessions list">
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

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No sessions to display.</span>
                )}
              >
                {session => (
                  <Table.Row id={session.id} className="align-top">
                    <Table.Cell>
                      <div className="flex max-w-96 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{session.isCurrent ? 'Current session' : 'Other session'}</span>

                          {session.isCurrent ? (
                            <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-foreground">
                              current
                            </span>
                          ) : null}
                        </div>

                        <span className="line-clamp-2 text-xs text-muted">{formatUserAgent(session.userAgent)}</span>
                        <span className="text-xs text-muted">Device: {session.deviceId}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>{session.ipAddress ?? 'Unknown'}</Table.Cell>

                    <Table.Cell>
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {getSessionStatus(session)}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(session.createdAt)}</Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(session.lastUsedAt)}</Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(session.expiresAt)}</Table.Cell>
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
