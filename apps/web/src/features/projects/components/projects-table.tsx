'use client'

import { StatusPill, TableIdentity } from '@/components/ui/data-table-card'
import { InlineStatusSelect } from '@/components/ui/inline-status-select'
import {
  RemoteDataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableFilterOption
} from '@/components/ui/remote-data-table'
import { updateProjectStatusAction } from '@/features/projects/actions/project-actions'
import { fetchProjectsPage } from '@/features/projects/api/client-queries'
import { formatDateTime } from '@/lib/formatters'
import { canArchiveProjects, canEditProjects } from '@/lib/projects/project-permissions'
import { PROJECT_FILTER_STATUS_OPTIONS, PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { buttonVariants, toast } from '@heroui/react'
import type { MembershipRole, ProjectStatus } from '@pulselane/contracts'
import type { ClientResponse } from '@pulselane/contracts/clients'
import type { ListProjectsQuery, ProjectResponse } from '@pulselane/contracts/projects'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo } from 'react'

import { ProjectArchiveButton } from './project-archive-button'

type ProjectsTableProps = {
  currentRole: MembershipRole
  clients: ClientResponse[]
}

function normalizeStatusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function getStatusTone(status: ProjectResponse['status']) {
  if (status === 'active' || status === 'completed') {
    return 'success' as const
  }

  if (status === 'on_hold') {
    return 'warning' as const
  }

  if (status === 'archived') {
    return 'danger' as const
  }

  return 'default' as const
}

function buildProjectFilters(clients: ClientResponse[]): DataTableFilter[] {
  const clientOptions: DataTableFilterOption[] = [
    { id: 'all', label: 'All clients' },
    ...clients.map(client => ({
      id: client.id,
      label: client.name
    }))
  ]

  return [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Project name or client',
      className: 'md:col-span-2'
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: PROJECT_FILTER_STATUS_OPTIONS
    },
    {
      id: 'clientId',
      label: 'Client',
      type: 'select',
      defaultValue: 'all',
      options: clientOptions
    },
    {
      id: 'includeArchived',
      label: 'Include archived',
      type: 'checkbox'
    }
  ]
}

function filtersToProjectQuery(filters: DataTableFilterValues): Partial<ListProjectsQuery> {
  const search = String(filters.search ?? '').trim()
  const status = String(filters.status ?? 'all')
  const clientId = String(filters.clientId ?? 'all')

  return {
    ...(search ? { search } : {}),
    ...(status && status !== 'all' ? { status: status as ProjectStatus } : {}),
    ...(clientId && clientId !== 'all' ? { clientId } : {}),
    includeArchived: Boolean(filters.includeArchived)
  }
}

export function ProjectsTable({ currentRole, clients }: ProjectsTableProps) {
  const queryClient = useQueryClient()
  const canEdit = canEditProjects(currentRole)
  const canArchive = canArchiveProjects(currentRole)
  const filters = useMemo(() => buildProjectFilters(clients), [clients])

  const updateStatusMutation = useMutation({
    mutationFn: updateProjectStatusAction,
    onSuccess: result => {
      if (result.status === 'error') {
        toast.danger(result.message)
        return
      }

      toast.success('Project status updated.')
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: error => {
      toast.danger(error instanceof Error ? error.message : 'Unable to update project status.')
    }
  })

  const columns = useMemo<Array<DataTableColumn<ProjectResponse>>>(
    () => [
      {
        id: 'project',
        header: 'Project',
        isRowHeader: true,
        render: project => <TableIdentity primary={project.name} secondary={project.id} />
      },
      {
        id: 'client',
        header: 'Client',
        cellClassName: 'text-muted',
        render: project => project.client.name
      },
      {
        id: 'status',
        header: 'Status',
        render: project =>
          canEdit ? (
            <InlineStatusSelect
              label={`Update ${project.name} status`}
              value={project.status}
              options={PROJECT_STATUS_OPTIONS}
              tone={getStatusTone(project.status)}
              isDisabled={updateStatusMutation.isPending}
              onChange={status =>
                updateStatusMutation.mutate({
                  projectId: project.id,
                  status,
                  expectedUpdatedAt: project.updatedAt
                })
              }
            />
          ) : (
            <StatusPill tone={getStatusTone(project.status)}>{normalizeStatusLabel(project.status)}</StatusPill>
          )
      },
      {
        id: 'updated',
        header: 'Updated',
        cellClassName: 'whitespace-nowrap text-muted',
        render: project => formatDateTime(project.updatedAt)
      }
    ],
    [canEdit, updateStatusMutation]
  )

  return (
    <RemoteDataTable
      title="Project pipeline"
      description="Filter delivery work by client and move project status directly from the row."
      ariaLabel="Projects list"
      queryKey={['projects']}
      columns={columns}
      filters={filters}
      emptyState="No projects match the current filters."
      getRowId={project => project.id}
      fetchPage={({ cursor, limit, filters: tableFilters }) =>
        fetchProjectsPage({
          ...filtersToProjectQuery(tableFilters),
          cursor,
          limit
        })
      }
      renderRowActions={project => (
        <>
          <Link
            href={`/app/projects/${project.id}`}
            className={buttonVariants({
              variant: canEdit ? 'outline' : 'ghost',
              size: 'sm'
            })}
          >
            {canEdit ? 'Edit' : 'View'}
          </Link>

          <ProjectArchiveButton
            projectId={project.id}
            isDisabled={!canArchive || project.status === 'archived'}
            onArchived={() => void queryClient.invalidateQueries({ queryKey: ['projects'] })}
          />
        </>
      )}
    />
  )
}
