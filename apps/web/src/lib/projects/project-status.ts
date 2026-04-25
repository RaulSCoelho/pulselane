import type { ProjectStatus } from '@pulselane/contracts'

type ProjectStatusOption = {
  id: ProjectStatus
  label: string
}

type ProjectFilterStatusOption =
  | ProjectStatusOption
  | {
      id: 'all'
      label: string
    }

export const PROJECT_STATUS_OPTIONS: ProjectStatusOption[] = [
  {
    id: 'active',
    label: 'Active'
  },
  {
    id: 'on_hold',
    label: 'On hold'
  },
  {
    id: 'completed',
    label: 'Completed'
  },
  {
    id: 'archived',
    label: 'Archived'
  }
]

export const PROJECT_FILTER_STATUS_OPTIONS: ProjectFilterStatusOption[] = [
  {
    id: 'all',
    label: 'All statuses'
  },
  ...PROJECT_STATUS_OPTIONS
]
