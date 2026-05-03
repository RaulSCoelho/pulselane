'use client'

import { StatusPill, TableIdentity } from '@/components/ui/data-table-card'
import { InlineStatusSelect } from '@/components/ui/inline-status-select'
import {
  RemoteDataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableFilterValues
} from '@/components/ui/remote-data-table'
import { updateClientStatusAction } from '@/features/clients/actions/client-actions'
import { fetchClientsPage } from '@/features/clients/api/client-queries'
import { canArchiveClients, canEditClients } from '@/lib/clients/client-permissions'
import { CLIENT_FILTER_STATUS_OPTIONS, CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { formatDateTime } from '@/lib/formatters'
import { buttonVariants, toast } from '@heroui/react'
import type { ClientStatus, MembershipRole } from '@pulselane/contracts'
import type { ClientResponse, ListClientsQuery } from '@pulselane/contracts/clients'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo } from 'react'

import { ClientArchiveButton } from './client-archive-button'

type ClientsTableProps = {
  currentRole: MembershipRole
}

const clientsFilters: DataTableFilter[] = [
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Client name, company or email',
    className: 'md:col-span-2'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    defaultValue: 'all',
    options: CLIENT_FILTER_STATUS_OPTIONS
  },
  {
    id: 'includeArchived',
    label: 'Include archived',
    type: 'checkbox'
  }
]

function normalizeStatusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function getStatusTone(status: ClientResponse['status']) {
  if (status === 'active') {
    return 'success' as const
  }

  if (status === 'archived') {
    return 'danger' as const
  }

  return 'default' as const
}

function filtersToClientQuery(filters: DataTableFilterValues): Partial<ListClientsQuery> {
  const search = String(filters.search ?? '').trim()
  const status = String(filters.status ?? 'all')

  return {
    ...(search ? { search } : {}),
    ...(status && status !== 'all' ? { status: status as ClientStatus } : {}),
    includeArchived: Boolean(filters.includeArchived)
  }
}

export function ClientsTable({ currentRole }: ClientsTableProps) {
  const queryClient = useQueryClient()
  const canEdit = canEditClients(currentRole)
  const canArchive = canArchiveClients(currentRole)

  const updateStatusMutation = useMutation({
    mutationFn: updateClientStatusAction,
    onSuccess: result => {
      if (result.status === 'error') {
        toast.danger(result.message)
        return
      }

      toast.success('Client status updated.')
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: error => {
      toast.danger(error instanceof Error ? error.message : 'Unable to update client status.')
    }
  })

  const columns = useMemo<Array<DataTableColumn<ClientResponse>>>(
    () => [
      {
        id: 'client',
        header: 'Client',
        isRowHeader: true,
        render: client => <TableIdentity primary={client.name} secondary={client.id} />
      },
      {
        id: 'company',
        header: 'Company',
        render: client => client.companyName || '-'
      },
      {
        id: 'email',
        header: 'Email',
        cellClassName: 'text-muted break-all',
        render: client => client.email || '-'
      },
      {
        id: 'status',
        header: 'Status',
        render: client =>
          canEdit ? (
            <InlineStatusSelect
              label={`Update ${client.name} status`}
              value={client.status}
              options={CLIENT_STATUS_OPTIONS}
              isDisabled={updateStatusMutation.isPending}
              onChange={status =>
                updateStatusMutation.mutate({
                  clientId: client.id,
                  status,
                  expectedUpdatedAt: client.updatedAt
                })
              }
            />
          ) : (
            <StatusPill tone={getStatusTone(client.status)}>{normalizeStatusLabel(client.status)}</StatusPill>
          )
      },
      {
        id: 'updated',
        header: 'Updated',
        cellClassName: 'whitespace-nowrap text-muted',
        render: client => formatDateTime(client.updatedAt)
      }
    ],
    [canEdit, updateStatusMutation]
  )

  return (
    <RemoteDataTable
      title="Client directory"
      description="Search, filter and update client status without leaving the list."
      ariaLabel="Clients list"
      queryKey={['clients']}
      columns={columns}
      filters={clientsFilters}
      emptyState="No clients match the current filters."
      getRowId={client => client.id}
      fetchPage={({ cursor, limit, filters }) =>
        fetchClientsPage({
          ...filtersToClientQuery(filters),
          cursor,
          limit
        })
      }
      renderRowActions={client => (
        <>
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
            onArchived={() => void queryClient.invalidateQueries({ queryKey: ['clients'] })}
          />
        </>
      )}
    />
  )
}
