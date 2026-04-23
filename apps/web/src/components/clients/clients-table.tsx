import { canArchiveClients, canEditClients } from '@/lib/clients/client-permissions'
import { Card, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import { ClientResponse } from '@pulselane/contracts/clients'
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
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Client
                </th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Company
                </th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Email
                </th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Status
                </th>
                <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Updated
                </th>
                <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map(client => (
                <tr key={client.id} className="align-top">
                  <td className="border-b px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted">{client.id}</span>
                    </div>
                  </td>

                  <td className="border-b px-4 py-4 text-sm text-foreground">{client.companyName || '—'}</td>

                  <td className="border-b px-4 py-4 text-sm text-foreground">{client.email || '—'}</td>

                  <td className="border-b px-4 py-4">
                    <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                      {client.status}
                    </span>
                  </td>

                  <td className="border-b px-4 py-4 text-sm text-foreground">{formatDatetime(client.updatedAt)}</td>

                  <td className="border-b px-4 py-4">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Content>
    </Card>
  )
}
