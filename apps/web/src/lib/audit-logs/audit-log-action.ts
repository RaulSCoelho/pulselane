import type { AuditLogAction } from '@pulselane/contracts'
import type { AuditLogResponse } from '@pulselane/contracts/audit-logs'

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

const actionLabelMap = Object.fromEntries(AUDIT_LOG_ACTION_OPTIONS.map(option => [option.id, option.label])) as Record<
  AuditLogAction,
  string
>

const actionToneMap = {
  created: 'success',
  updated: 'info',
  archived: 'warning',
  deleted: 'danger'
} satisfies Record<AuditLogAction, 'success' | 'info' | 'warning' | 'danger'>

const entityTypeLabelMap: Record<string, string> = {
  client: 'Client',
  comment: 'Comment',
  membership: 'Membership',
  organization: 'Organization',
  organization_billing: 'Billing',
  organization_invitation: 'Invitation',
  project: 'Project',
  task: 'Task'
}

export function formatAuditLogActionLabel(action: AuditLogAction) {
  return actionLabelMap[action] ?? humanizeToken(action)
}

export function getAuditLogActionTone(action: AuditLogAction) {
  return actionToneMap[action]
}

export function formatAuditLogEntityLabel(entityType: string) {
  return entityTypeLabelMap[entityType] ?? humanizeToken(entityType)
}

export function getAuditLogEventSummary(auditLog: AuditLogResponse) {
  const entityLabel = formatAuditLogEntityLabel(auditLog.entityType).toLowerCase()
  const targetLabel = getMetadataTargetLabel(auditLog.metadata)
  const targetSuffix = targetLabel ? `: ${targetLabel}` : ''

  return `${auditLog.actorUser.name} ${auditLog.action} ${entityLabel}${targetSuffix}.`
}

function humanizeToken(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getMetadataTargetLabel(metadata: unknown) {
  if (!isRecord(metadata)) {
    return null
  }

  const candidates = [
    metadata.name,
    metadata.title,
    metadata.email,
    metadata.body,
    metadata.targetPlan,
    metadata.plan,
    metadata.role,
    metadata.status
  ]

  const value = candidates.find(candidate => typeof candidate === 'string' && candidate.trim().length > 0)

  return typeof value === 'string' ? truncateSummaryValue(humanizeSummaryValue(value)) : null
}

function humanizeSummaryValue(value: string) {
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(value)) {
    return value.replaceAll('_', ' ')
  }

  return value
}

function truncateSummaryValue(value: string) {
  return value.length > 90 ? `${value.slice(0, 87)}...` : value
}
