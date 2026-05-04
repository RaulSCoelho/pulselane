import { formatBooleanLabel, formatPeriodEnd, formatUsageLimit } from '@/lib/formatters'
import type { SessionListResponse } from '@pulselane/contracts/auth'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

export type DashboardMetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'cyan' | 'orange'

export type DashboardMetric = {
  label: string
  value: string
  detail?: string
  tone?: DashboardMetricTone
  meter?: {
    value: number
    label: string
  }
}

export type DashboardMetricGroup = {
  title: string
  description: string
  metrics: DashboardMetric[]
}

export const organizationDashboardMetricLabels = {
  workspace: ['Organization', 'Slug', 'Current role'],
  billing: ['Plan', 'Status', 'Period end', 'Cancel at period end', 'Stripe customer', 'Stripe subscription'],
  usage: ['Members usage', 'Clients usage', 'Projects usage', 'Active tasks usage'],
  sessions: ['Active sessions', 'Other devices', 'Current session']
} as const

type BuildOrganizationDashboardMetricGroupsOptions = {
  currentOrganization: CurrentOrganizationResponse
  currentBilling: BillingPlansResponse['current'] | null
  sessions: SessionListResponse | null
}

export function buildOrganizationDashboardMetricGroups({
  currentOrganization,
  currentBilling,
  sessions
}: BuildOrganizationDashboardMetricGroupsOptions): DashboardMetricGroup[] {
  const billing = currentBilling ?? currentOrganization.plan

  return [
    {
      title: 'Workspace',
      description: 'Current tenant identity and access context.',
      metrics: [
        {
          label: 'Organization',
          value: currentOrganization.organization.name
        },
        {
          label: 'Slug',
          value: currentOrganization.organization.slug
        },
        {
          label: 'Current role',
          value: formatTokenLabel(currentOrganization.currentRole),
          tone: currentOrganization.currentRole === 'viewer' ? 'default' : 'info'
        }
      ]
    },
    {
      title: 'Plan and billing',
      description: 'Current subscription state for the active organization.',
      metrics: [
        {
          label: 'Plan',
          value: formatTokenLabel(billing.plan),
          tone: billing.plan === 'growth' ? 'cyan' : 'accent'
        },
        {
          label: 'Status',
          value: formatTokenLabel(billing.status),
          tone: getBillingStatusTone(billing.status)
        },
        {
          label: 'Period end',
          value: formatPeriodEnd(billing.currentPeriodEnd)
        },
        {
          label: 'Cancel at period end',
          value: formatBooleanLabel(billing.cancelAtPeriodEnd),
          detail: billing.cancelAtPeriodEnd
            ? 'Plan will change when the period closes.'
            : 'Renewal is currently active.',
          tone: billing.cancelAtPeriodEnd ? 'orange' : 'success'
        },
        buildConfiguredMetric('Stripe customer', currentBilling ? currentBilling.stripeCustomerConfigured : null),
        buildConfiguredMetric(
          'Stripe subscription',
          currentBilling ? currentBilling.stripeSubscriptionConfigured : null
        )
      ]
    },
    {
      title: 'Usage and limits',
      description: 'Backend-enforced plan usage for the active organization.',
      metrics: [
        buildUsageMetric('Members usage', currentOrganization.usage.members, currentOrganization.limits.members),
        buildUsageMetric('Clients usage', currentOrganization.usage.clients, currentOrganization.limits.clients),
        buildUsageMetric('Projects usage', currentOrganization.usage.projects, currentOrganization.limits.projects),
        buildUsageMetric(
          'Active tasks usage',
          currentOrganization.usage.activeTasks,
          currentOrganization.limits.activeTasks
        )
      ]
    },
    {
      title: 'Account security',
      description: 'Authenticated session footprint for this user.',
      metrics: buildSessionDashboardMetrics(sessions)
    }
  ]
}

function buildSessionDashboardMetrics(sessions: SessionListResponse | null): DashboardMetric[] {
  if (!sessions) {
    return [
      {
        label: 'Active sessions',
        value: 'Unavailable',
        tone: 'warning'
      },
      {
        label: 'Other devices',
        value: 'Unavailable',
        tone: 'warning'
      },
      {
        label: 'Current session',
        value: 'Unavailable',
        tone: 'warning'
      }
    ]
  }

  const activeSessions = sessions.filter(session => session.isActive && !session.revokedAt)
  const otherActiveSessions = activeSessions.filter(session => !session.isCurrent)

  return [
    {
      label: 'Active sessions',
      value: String(activeSessions.length),
      detail: activeSessions.length === 1 ? 'Only this session is active.' : 'Review devices regularly.',
      tone: activeSessions.length > 1 ? 'info' : 'success'
    },
    {
      label: 'Other devices',
      value: String(otherActiveSessions.length),
      detail:
        otherActiveSessions.length > 0 ? 'There are active sessions outside this device.' : 'No other device active.',
      tone: otherActiveSessions.length > 0 ? 'warning' : 'success'
    },
    {
      label: 'Current session',
      value: activeSessions.some(session => session.isCurrent) ? 'Detected' : 'Not detected',
      tone: activeSessions.some(session => session.isCurrent) ? 'success' : 'danger'
    }
  ]
}

function formatConfiguredLabel(value: boolean) {
  return value ? 'Configured' : 'Missing'
}

function formatTokenLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function getBillingStatusTone(status: string): DashboardMetricTone {
  if (status === 'active' || status === 'trialing' || status === 'free') {
    return 'success'
  }

  if (status === 'past_due' || status === 'incomplete') {
    return 'danger'
  }

  if (status === 'canceled') {
    return 'warning'
  }

  return 'default'
}

function buildConfiguredMetric(label: string, value: boolean | null): DashboardMetric {
  if (value === null) {
    return {
      label,
      value: 'Unavailable',
      tone: 'warning'
    }
  }

  return {
    label,
    value: formatConfiguredLabel(value),
    tone: value ? 'success' : 'danger'
  }
}

function buildUsageMetric(label: string, usage: number, limit: number | null): DashboardMetric {
  if (limit === null) {
    return {
      label,
      value: formatUsageLimit(usage, limit),
      detail: 'Unlimited plan limit.',
      tone: 'info'
    }
  }

  if (limit <= 0) {
    return {
      label,
      value: formatUsageLimit(usage, limit),
      detail: usage > 0 ? `${usage} above limit.` : 'No capacity available.',
      tone: usage > 0 ? 'danger' : 'warning',
      meter: {
        value: usage > 0 ? 100 : 0,
        label: `${label} capacity`
      }
    }
  }

  const usageRatio = usage / limit
  const remaining = limit - usage
  const percentage = Math.min(Math.round(usageRatio * 100), 100)

  return {
    label,
    value: formatUsageLimit(usage, limit),
    detail: formatUsageDetail(remaining),
    tone: getUsageTone(usageRatio),
    meter: {
      value: percentage,
      label: `${percentage}% used`
    }
  }
}

function getUsageTone(usageRatio: number): DashboardMetricTone {
  if (usageRatio >= 0.9) {
    return 'danger'
  }

  if (usageRatio >= 0.75) {
    return 'warning'
  }

  return 'success'
}

function formatUsageDetail(remaining: number) {
  if (remaining > 0) {
    return `${remaining} remaining.`
  }

  if (remaining === 0) {
    return 'At limit.'
  }

  return `${Math.abs(remaining)} above limit.`
}
