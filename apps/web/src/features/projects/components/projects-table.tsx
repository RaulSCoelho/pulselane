'use client'

import { DataTableCard, StatusPill, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { formatDateTime } from '@/lib/formatters'
import { canArchiveProjects, canEditProjects } from '@/lib/projects/project-permissions'
import { Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import Link from 'next/link'

import { ProjectArchiveButton } from './project-archive-button'

type ProjectsTableProps = {
  items: ProjectResponse[]
  currentRole: MembershipRole
}

export function ProjectsTable({ items, currentRole }: ProjectsTableProps) {
  const canEdit = canEditProjects(currentRole)
  const canArchive = canArchiveProjects(currentRole)

  return (
    <DataTableCard
      title="Projects list"
      description="Operational projects registered in the active organization."
      ariaLabel="Projects list"
    >
      <Table.Header>
        <Table.Column id="project" isRowHeader>
          Project
        </Table.Column>
        <Table.Column id="client">Client</Table.Column>
        <Table.Column id="status">Status</Table.Column>
        <Table.Column id="updated">Updated</Table.Column>
        <Table.Column id="actions" className="text-right">
          Actions
        </Table.Column>
      </Table.Header>

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No projects to display.</TableEmptyState>}>
        {project => (
          <Table.Row id={project.id} className="align-top">
            <Table.Cell>
              <TableIdentity primary={project.name} secondary={project.id} />
            </Table.Cell>

            <Table.Cell>{project.client.name}</Table.Cell>

            <Table.Cell>
              <StatusPill>{project.status}</StatusPill>
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatDateTime(project.updatedAt)}</Table.Cell>

            <Table.Cell>
              <div className="flex justify-end gap-2">
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
                />
              </div>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </DataTableCard>
  )
}
