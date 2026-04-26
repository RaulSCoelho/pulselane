'use client'

import { canArchiveTasks, canEditTasks } from '@/lib/tasks/task-permissions'
import { Card, Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { TaskResponse } from '@pulselane/contracts/tasks'
import Link from 'next/link'

import { TaskArchiveButton } from './task-archive-button'

type TasksTableProps = {
  items: TaskResponse[]
  currentRole: MembershipRole
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function formatOptionalDatetime(value: string | null) {
  return value ? formatDatetime(value) : '—'
}

export function TasksTable({ items, currentRole }: TasksTableProps) {
  const canEdit = canEditTasks(currentRole)
  const canArchive = canArchiveTasks(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Tasks list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Daily operational work scoped to the active organization.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Tasks list">
              <Table.Header>
                <Table.Column id="task" isRowHeader>
                  Task
                </Table.Column>
                <Table.Column id="project">Project</Table.Column>
                <Table.Column id="assignee">Assignee</Table.Column>
                <Table.Column id="status">Status</Table.Column>
                <Table.Column id="priority">Priority</Table.Column>
                <Table.Column id="dueDate">Due date</Table.Column>
                <Table.Column id="actions" className="text-right">
                  Actions
                </Table.Column>
              </Table.Header>

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No tasks to display.</span>
                )}
              >
                {task => (
                  <Table.Row id={task.id} className="align-top">
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{task.title}</span>
                        <span className="text-xs text-muted">{task.id}</span>
                      </div>
                    </Table.Cell>

                    <Table.Cell>{task.project.name}</Table.Cell>

                    <Table.Cell>{task.assignee?.name ?? 'Unassigned'}</Table.Cell>

                    <Table.Cell>
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {task.status}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                        {task.priority}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap">{formatOptionalDatetime(task.dueDate)}</Table.Cell>

                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/app/tasks/${task.id}`}
                          className={buttonVariants({
                            variant: canEdit ? 'outline' : 'ghost',
                            size: 'sm'
                          })}
                        >
                          {canEdit ? 'Edit' : 'View'}
                        </Link>

                        <TaskArchiveButton taskId={task.id} isDisabled={!canArchive || task.status === 'archived'} />
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
