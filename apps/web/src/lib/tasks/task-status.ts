import type { TaskPriority, TaskSortBy, TaskStatus } from '@pulselane/contracts'

type TaskStatusOption = {
  id: TaskStatus
  label: string
}

type TaskPriorityOption = {
  id: TaskPriority
  label: string
}

type TaskSortByOption = {
  id: TaskSortBy
  label: string
}

type FilterOption<T extends string> =
  | {
      id: 'all'
      label: string
    }
  | {
      id: T
      label: string
    }

export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  {
    id: 'todo',
    label: 'Todo'
  },
  {
    id: 'in_progress',
    label: 'In progress'
  },
  {
    id: 'blocked',
    label: 'Blocked'
  },
  {
    id: 'done',
    label: 'Done'
  },
  {
    id: 'archived',
    label: 'Archived'
  }
]

export const TASK_FILTER_STATUS_OPTIONS: FilterOption<TaskStatus>[] = [
  {
    id: 'all',
    label: 'All statuses'
  },
  ...TASK_STATUS_OPTIONS
]

export const TASK_PRIORITY_OPTIONS: TaskPriorityOption[] = [
  {
    id: 'low',
    label: 'Low'
  },
  {
    id: 'medium',
    label: 'Medium'
  },
  {
    id: 'high',
    label: 'High'
  },
  {
    id: 'urgent',
    label: 'Urgent'
  }
]

export const TASK_FILTER_PRIORITY_OPTIONS: FilterOption<TaskPriority>[] = [
  {
    id: 'all',
    label: 'All priorities'
  },
  ...TASK_PRIORITY_OPTIONS
]

export const TASK_SORT_BY_OPTIONS: TaskSortByOption[] = [
  {
    id: 'created_at',
    label: 'Created date'
  },
  {
    id: 'due_date',
    label: 'Due date'
  }
]
