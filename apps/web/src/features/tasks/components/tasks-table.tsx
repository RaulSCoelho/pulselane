'use client'

import { DataTableCard, StatusPill, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { formatOptionalDateTime } from '@/lib/formatters'
import { canArchiveTasks, canEditTasks } from '@/lib/tasks/task-permissions'
import { Table, buttonVariants } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { TaskResponse } from '@pulselane/contracts/tasks'
import Link from 'next/link'

import { TaskArchiveButton } from './task-archive-button'

type TasksTableProps = {
  items: TaskResponse[]
  currentRole: MembershipRole
}

export function TasksTable({ items, currentRole }: TasksTableProps) {
  const canEdit = canEditTasks(currentRole)
  const canArchive = canArchiveTasks(currentRole)

  return (
    <DataTableCard
      title="Tasks list"
      description="Daily operational work scoped to the active organization."
      ariaLabel="Tasks list"
    >
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

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No tasks to display.</TableEmptyState>}>
        {task => (
          <Table.Row id={task.id} className="align-top">
            <Table.Cell>
              <TableIdentity primary={task.title} secondary={task.id} />
            </Table.Cell>

            <Table.Cell>{task.project.name}</Table.Cell>

            <Table.Cell>{task.assignee?.name ?? 'Unassigned'}</Table.Cell>

            <Table.Cell>
              <StatusPill>{task.status}</StatusPill>
            </Table.Cell>

            <Table.Cell>
              <StatusPill>{task.priority}</StatusPill>
            </Table.Cell>

            <Table.Cell className="whitespace-nowrap">{formatOptionalDateTime(task.dueDate)}</Table.Cell>

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
    </DataTableCard>
  )
}
