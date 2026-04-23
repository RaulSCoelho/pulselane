import type { ClientStatus } from '@pulselane/contracts'

export const CLIENT_STATUS_OPTIONS: Array<{ id: ClientStatus; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'archived', label: 'Archived' }
]

export const CLIENT_FILTER_STATUS_OPTIONS = [{ id: 'all', label: 'All statuses' }, ...CLIENT_STATUS_OPTIONS] as const
