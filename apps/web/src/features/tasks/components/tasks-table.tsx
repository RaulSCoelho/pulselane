'use client'

import { StatusPill, TableIdentity } from '@/components/ui/data-table-card'
import { InlineStatusSelect } from '@/components/ui/inline-status-select'
import {
  RemoteDataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableFilterOption,
  type DataTableFilterValues
} from '@/components/ui/remote-data-table'
import { updateTaskStatusAction } from '@/features/tasks/actions/task-actions'
import { fetchTasksPage } from '@/features/tasks/api/client-queries'
import { formatOptionalDateTime } from '@/lib/formatters'
import { canArchiveTasks, canEditTasks } from '@/lib/tasks/task-permissions'
import {
  TASK_FILTER_PRIORITY_OPTIONS,
  TASK_FILTER_STATUS_OPTIONS,
  TASK_SORT_BY_OPTIONS,
  TASK_STATUS_OPTIONS
} from '@/lib/tasks/task-status'
import { buttonVariants, toast } from '@heroui/react'
import type { MembershipRole, SortDirection, TaskPriority, TaskSortBy, TaskStatus } from '@pulselane/contracts'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import type { ListTasksQuery, TaskResponse } from '@pulselane/contracts/tasks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo } from 'react'

import { TaskArchiveButton } from './task-archive-button'

type TasksTableProps = {
  currentRole: MembershipRole
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
}

function normalizeLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function getStatusTone(status: TaskResponse['status']) {
  if (status === 'done') {
    return 'success' as const
  }

  if (status === 'in_progress') {
    return 'info' as const
  }

  if (status === 'blocked' || status === 'archived') {
    return 'danger' as const
  }

  return 'default' as const
}

function getPriorityTone(priority: TaskResponse['priority']) {
  if (priority === 'urgent') {
    return 'danger' as const
  }

  if (priority === 'high') {
    return 'warning' as const
  }

  if (priority === 'medium') {
    return 'info' as const
  }

  return 'default' as const
}

function isTaskOverdue(task: TaskResponse) {
  if (!task.dueDate || task.status === 'done' || task.status === 'archived') {
    return false
  }

  return new Date(task.dueDate).getTime() < Date.now()
}

function buildTaskFilters(projects: ProjectResponse[], memberships: MembershipResponse[]): DataTableFilter[] {
  const projectOptions: DataTableFilterOption[] = [
    { id: 'all', label: 'All projects' },
    ...projects.map(project => ({
      id: project.id,
      label: project.name
    }))
  ]

  const assigneeOptions: DataTableFilterOption[] = [
    { id: 'all', label: 'All assignees' },
    ...memberships.map(membership => ({
      id: membership.userId,
      label: membership.user.name
    }))
  ]

  return [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Task title or description',
      className: 'md:col-span-2'
    },
    {
      id: 'projectId',
      label: 'Project',
      type: 'select',
      defaultValue: 'all',
      options: projectOptions
    },
    {
      id: 'assigneeUserId',
      label: 'Assignee',
      type: 'select',
      defaultValue: 'all',
      options: assigneeOptions
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: TASK_FILTER_STATUS_OPTIONS
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'select',
      defaultValue: 'all',
      options: TASK_FILTER_PRIORITY_OPTIONS
    },
    {
      id: 'sortBy',
      label: 'Sort by',
      type: 'select',
      defaultValue: 'created_at',
      options: TASK_SORT_BY_OPTIONS
    },
    {
      id: 'sortDirection',
      label: 'Direction',
      type: 'select',
      defaultValue: 'desc',
      options: [
        { id: 'desc', label: 'Descending' },
        { id: 'asc', label: 'Ascending' }
      ]
    },
    {
      id: 'overdue',
      label: 'Only overdue',
      type: 'checkbox'
    },
    {
      id: 'includeArchived',
      label: 'Include archived',
      type: 'checkbox'
    }
  ]
}

function filtersToTaskQuery(filters: DataTableFilterValues): Partial<ListTasksQuery> {
  const search = String(filters.search ?? '').trim()
  const projectId = String(filters.projectId ?? 'all')
  const assigneeUserId = String(filters.assigneeUserId ?? 'all')
  const status = String(filters.status ?? 'all')
  const priority = String(filters.priority ?? 'all')

  return {
    ...(search ? { search } : {}),
    ...(projectId && projectId !== 'all' ? { projectId } : {}),
    ...(assigneeUserId && assigneeUserId !== 'all' ? { assigneeUserId } : {}),
    ...(status && status !== 'all' ? { status: status as TaskStatus } : {}),
    ...(priority && priority !== 'all' ? { priority: priority as TaskPriority } : {}),
    overdue: Boolean(filters.overdue),
    includeArchived: Boolean(filters.includeArchived),
    sortBy: String(filters.sortBy ?? 'created_at') as TaskSortBy,
    sortDirection: String(filters.sortDirection ?? 'desc') as SortDirection
  }
}

export function TasksTable({ currentRole, projects, memberships }: TasksTableProps) {
  const queryClient = useQueryClient()
  const canEdit = canEditTasks(currentRole)
  const canArchive = canArchiveTasks(currentRole)
  const filters = useMemo(() => buildTaskFilters(projects, memberships), [memberships, projects])

  const updateStatusMutation = useMutation({
    mutationFn: updateTaskStatusAction,
    onSuccess: result => {
      if (result.status === 'error') {
        toast.danger(result.message)
        return
      }

      toast.success('Task status updated.')
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: error => {
      toast.danger(error instanceof Error ? error.message : 'Unable to update task status.')
    }
  })

  const columns = useMemo<Array<DataTableColumn<TaskResponse>>>(
    () => [
      {
        id: 'task',
        header: 'Task',
        isRowHeader: true,
        cellClassName: 'max-w-80',
        render: task => (
          <TableIdentity
            primary={task.title}
            secondary={task.blockedReason ? `Blocked: ${task.blockedReason}` : task.id}
          />
        )
      },
      {
        id: 'project',
        header: 'Project',
        cellClassName: 'text-muted',
        render: task => task.project.name
      },
      {
        id: 'assignee',
        header: 'Assignee',
        render: task => task.assignee?.name ?? 'Unassigned'
      },
      {
        id: 'status',
        header: 'Status',
        render: task =>
          canEdit ? (
            <InlineStatusSelect
              label={`Update ${task.title} status`}
              value={task.status}
              options={TASK_STATUS_OPTIONS}
              isDisabled={updateStatusMutation.isPending}
              onChange={status =>
                updateStatusMutation.mutate({
                  taskId: task.id,
                  status,
                  expectedUpdatedAt: task.updatedAt
                })
              }
            />
          ) : (
            <StatusPill tone={getStatusTone(task.status)}>{normalizeLabel(task.status)}</StatusPill>
          )
      },
      {
        id: 'priority',
        header: 'Priority',
        render: task => <StatusPill tone={getPriorityTone(task.priority)}>{normalizeLabel(task.priority)}</StatusPill>
      },
      {
        id: 'dueDate',
        header: 'Due date',
        cellClassName: 'whitespace-nowrap',
        render: task => (
          <span className={isTaskOverdue(task) ? 'font-medium text-danger' : 'text-muted'}>
            {formatOptionalDateTime(task.dueDate)}
            {isTaskOverdue(task) ? ' overdue' : ''}
          </span>
        )
      }
    ],
    [canEdit, updateStatusMutation]
  )

  return (
    <RemoteDataTable
      title="Task board"
      description="Filter operational work and move status directly from each row."
      ariaLabel="Tasks list"
      queryKey={['tasks']}
      columns={columns}
      filters={filters}
      minTableWidthClassName="min-w-245"
      emptyState="No tasks match the current filters."
      getRowId={task => task.id}
      fetchPage={({ cursor, limit, filters: tableFilters }) =>
        fetchTasksPage({
          ...filtersToTaskQuery(tableFilters),
          cursor,
          limit
        })
      }
      renderRowActions={task => (
        <>
          <Link
            href={`/app/tasks/${task.id}`}
            className={buttonVariants({
              variant: canEdit ? 'outline' : 'ghost',
              size: 'sm'
            })}
          >
            {canEdit ? 'Edit' : 'View'}
          </Link>

          <TaskArchiveButton
            taskId={task.id}
            isDisabled={!canArchive || task.status === 'archived'}
            onArchived={() => void queryClient.invalidateQueries({ queryKey: ['tasks'] })}
          />
        </>
      )}
    />
  )
}
