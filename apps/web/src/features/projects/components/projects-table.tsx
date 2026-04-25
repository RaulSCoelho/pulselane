'use client'

import { canArchiveProjects, canEditProjects } from '@/lib/projects/project-permissions'
import { Card, Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import Link from 'next/link'

import { ProjectArchiveButton } from './project-archive-button'

type ProjectsTableProps = {
  items: ProjectResponse[]
  currentRole: MembershipRole
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function ProjectsTable({ items, currentRole }: ProjectsTableProps) {
  const canEdit = canEditProjects(currentRole)
  const canArchive = canArchiveProjects(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Projects list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Operational projects registered in the active organization.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Projects list">
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

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No projects to display.</span>
                )}
              >
                {project => (
                  <Table.Row id={project.id} className="align-top">
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted">{project.id}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>{project.client.name}</Table.Cell>

                    <Table.Cell>
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {project.status}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatDatetime(project.updatedAt)}</Table.Cell>

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
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card.Content>
    </Card>
  )
}
