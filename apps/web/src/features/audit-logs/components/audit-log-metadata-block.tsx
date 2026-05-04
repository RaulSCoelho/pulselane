'use client'

import { formatOptionalDateTime } from '@/lib/formatters'
import { Button, Disclosure } from '@heroui/react'
import { Braces } from 'lucide-react'

type AuditLogMetadataBlockProps = {
  metadata: unknown
}

type MetadataDetail = {
  label: string
  value: string
}

const knownLabelMap: Record<string, string> = {
  archivedAt: 'Archived at',
  assigneePolicy: 'Assignee policy',
  assigneeUserId: 'Assignee user ID',
  billingPortalSessionUrl: 'Billing portal session',
  blockedReason: 'Blocked reason',
  cancelAtPeriodEnd: 'Cancel at period end',
  checkoutSessionId: 'Checkout session ID',
  clientId: 'Client ID',
  companyName: 'Company name',
  currentPeriodEnd: 'Current period end',
  deletedAt: 'Deleted at',
  dueDate: 'Due date',
  email: 'Email',
  expiresAt: 'Expires at',
  name: 'Name',
  plan: 'Plan',
  previousCancelAtPeriodEnd: 'Previous cancel at period end',
  previousCurrentPeriodEnd: 'Previous current period end',
  previousName: 'Previous name',
  previousPlan: 'Previous plan',
  previousSlug: 'Previous slug',
  previousStatus: 'Previous status',
  previousStripeCustomerId: 'Previous Stripe customer ID',
  previousStripeSubscriptionId: 'Previous Stripe subscription ID',
  projectId: 'Project ID',
  removedRole: 'Removed role',
  removedUserId: 'Removed user ID',
  role: 'Role',
  slug: 'Slug',
  source: 'Source',
  status: 'Status',
  stripeCustomerId: 'Stripe customer ID',
  stripeSubscriptionId: 'Stripe subscription ID',
  targetPlan: 'Target plan',
  taskId: 'Task ID',
  title: 'Title',
  unassignedTasksCount: 'Unassigned tasks'
}

const knownValueMap: Record<string, string> = {
  set_null: 'Unassign affected tasks',
  stripe_billing_portal: 'Stripe billing portal',
  stripe_checkout_session: 'Stripe checkout session',
  stripe_webhook: 'Stripe webhook'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function formatMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) {
    return null
  }

  return JSON.stringify(metadata, null, 2)
}

function formatMetadataKey(key: string) {
  return (
    knownLabelMap[key] ??
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replace(/\bid\b/gi, 'ID')
      .replace(/\b\w/g, character => character.toUpperCase())
  )
}

function formatKnownStringValue(value: string) {
  if (knownValueMap[value]) {
    return knownValueMap[value]
  }

  if (/^[a-z]+(_[a-z0-9]+)+$/.test(value)) {
    return value.replaceAll('_', ' ')
  }

  return value
}

function looksLikeDateKey(key: string) {
  return /(?:At|Date|End|Expires)$/i.test(key)
}

function formatMetadataValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'None'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'string') {
    if (looksLikeDateKey(key)) {
      return formatOptionalDateTime(value)
    }

    return truncateValue(formatKnownStringValue(value))
  }

  return truncateValue(JSON.stringify(value))
}

function truncateValue(value: string) {
  return value.length > 180 ? `${value.slice(0, 177)}...` : value
}

function getCurrentKeyFromPreviousKey(key: string) {
  const withoutPrefix = key.replace(/^previous/, '')

  if (withoutPrefix === key || withoutPrefix.length === 0) {
    return null
  }

  return `${withoutPrefix[0]?.toLowerCase() ?? ''}${withoutPrefix.slice(1)}`
}

function buildDetailsFromRecord(metadata: Record<string, unknown>): MetadataDetail[] {
  const details: MetadataDetail[] = []
  const consumedKeys = new Set<string>()

  for (const key of Object.keys(metadata)) {
    const currentKey = getCurrentKeyFromPreviousKey(key)

    if (!currentKey || !(currentKey in metadata)) {
      continue
    }

    consumedKeys.add(key)
    consumedKeys.add(currentKey)

    const previousValue = formatMetadataValue(key, metadata[key])
    const currentValue = formatMetadataValue(currentKey, metadata[currentKey])

    details.push({
      label: `${formatMetadataKey(currentKey)} changed`,
      value: `${previousValue} -> ${currentValue}`
    })
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (consumedKeys.has(key)) {
      continue
    }

    details.push({
      label: formatMetadataKey(key),
      value: formatMetadataValue(key, value)
    })
  }

  return details
}

function buildMetadataDetails(metadata: unknown): MetadataDetail[] {
  if (metadata === null || metadata === undefined) {
    return []
  }

  if (isRecord(metadata)) {
    return buildDetailsFromRecord(metadata)
  }

  return [
    {
      label: 'Value',
      value: formatMetadataValue('value', metadata)
    }
  ]
}

export function AuditLogMetadataBlock({ metadata }: AuditLogMetadataBlockProps) {
  const formatted = formatMetadata(metadata)
  const details = buildMetadataDetails(metadata)

  if (details.length === 0 && !formatted) {
    return <span className="whitespace-nowrap text-xs text-muted">No metadata</span>
  }

  return (
    <Disclosure className="min-w-0">
      <Disclosure.Heading>
        <Button slot="trigger" size="sm" variant="ghost">
          <Braces aria-hidden="true" className="size-4" strokeWidth={1.8} />
          {details.length > 0 ? `${details.length} fields` : 'Raw metadata'}
          <Disclosure.Indicator />
        </Button>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="mt-2 flex max-w-2xl min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface p-3 shadow-surface">
          {details.length > 0 ? (
            <dl className="grid gap-2 overflow-auto sm:grid-cols-2">
              {details.map(detail => (
                <div
                  key={`${detail.label}-${detail.value}`}
                  className="grid min-w-0 gap-1 rounded-lg bg-surface-secondary p-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{detail.label}</dt>
                  <dd className="text-sm leading-5 text-foreground wrap-break-word overflow-auto">{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {formatted ? (
            <div className="min-w-0 overflow-hidden rounded-lg border border-brand-dark-border bg-brand-dark-background">
              <div className="border-b border-brand-dark-border px-3 py-2 text-xs font-medium text-brand-light-text">
                Raw metadata
              </div>
              <pre className="max-h-56 overflow-auto p-3 text-xs leading-5 text-brand-light-text">{formatted}</pre>
            </div>
          ) : null}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  )
}
