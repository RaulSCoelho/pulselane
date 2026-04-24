'use client'

import { canArchiveClients, canEditClients } from '@/lib/clients/client-permissions'
import { Card, Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { ClientResponse } from '@pulselane/contracts/clients'
import Link from 'next/link'

import { ClientArchiveButton } from './client-archive-button'

type ClientsTableProps = {
  items: ClientResponse[]
  currentRole: MembershipRole
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function ClientsTable({ items, currentRole }: ClientsTableProps) {
  const canEdit = canEditClients(currentRole)
  const canArchive = canArchiveClients(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Clients list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Operational entities already registered in the active organization.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Clients list">
              <Table.Header>
                <Table.Column id="client" isRowHeader>
                  Client
                </Table.Column>
                <Table.Column id="company">Company</Table.Column>
                <Table.Column id="email">Email</Table.Column>
                <Table.Column id="status">Status</Table.Column>
                <Table.Column id="updated">Updated</Table.Column>
                <Table.Column id="actions" className="text-right">
                  Actions
                </Table.Column>
              </Table.Header>

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No clients to display.</span>
                )}
              >
                {client => (
                  <Table.Row id={client.id} className="align-top">
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-muted">{client.id}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>{client.companyName || '—'}</Table.Cell>

                    <Table.Cell>{client.email || '—'}</Table.Cell>

                    <Table.Cell>
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {client.status}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(client.updatedAt)}</Table.Cell>

                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/app/clients/${client.id}`}
                          className={buttonVariants({
                            variant: canEdit ? 'outline' : 'ghost',
                            size: 'sm'
                          })}
                        >
                          {canEdit ? 'Edit' : 'View'}
                        </Link>

                        <ClientArchiveButton
                          clientId={client.id}
                          isDisabled={!canArchive || client.status === 'archived'}
                        />
                      </div>
                    </Table.Cell>
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
