import type { AuditLogAction } from '@pulselane/contracts'

type AuditLogActionOption = {
  id: AuditLogAction
  label: string
}

type AuditLogFilterActionOption =
  | {
      id: 'all'
      label: string
    }
  | AuditLogActionOption

export const AUDIT_LOG_ACTION_OPTIONS: AuditLogActionOption[] = [
  {
    id: 'created',
    label: 'Created'
  },
  {
    id: 'updated',
    label: 'Updated'
  },
  {
    id: 'archived',
    label: 'Archived'
  },
  {
    id: 'deleted',
    label: 'Deleted'
  }
]

export const AUDIT_LOG_FILTER_ACTION_OPTIONS: AuditLogFilterActionOption[] = [
  {
    id: 'all',
    label: 'All actions'
  },
  ...AUDIT_LOG_ACTION_OPTIONS
]
