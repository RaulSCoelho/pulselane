'use client'

import { DataTableCard, StatusPill, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { canArchiveClients, canEditClients } from '@/lib/clients/client-permissions'
import { formatDateTime } from '@/lib/formatters'
import { Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { ClientResponse } from '@pulselane/contracts/clients'
import Link from 'next/link'

import { ClientArchiveButton } from './client-archive-button'

type ClientsTableProps = {
  items: ClientResponse[]
  currentRole: MembershipRole
}

export function ClientsTable({ items, currentRole }: ClientsTableProps) {
  const canEdit = canEditClients(currentRole)
  const canArchive = canArchiveClients(currentRole)

  return (
    <DataTableCard
      title="Clients list"
      description="Operational entities already registered in the active organization."
      ariaLabel="Clients list"
    >
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

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No clients to display.</TableEmptyState>}>
        {client => (
          <Table.Row id={client.id} className="align-top">
            <Table.Cell>
              <TableIdentity primary={client.name} secondary={client.id} />
            </Table.Cell>

            <Table.Cell>{client.companyName || '—'}</Table.Cell>

            <Table.Cell>{client.email || '—'}</Table.Cell>

            <Table.Cell>
              <StatusPill>{client.status}</StatusPill>
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(client.updatedAt)}</Table.Cell>

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

                <ClientArchiveButton clientId={client.id} isDisabled={!canArchive || client.status === 'archived'} />
              </div>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </DataTableCard>
  )
}
