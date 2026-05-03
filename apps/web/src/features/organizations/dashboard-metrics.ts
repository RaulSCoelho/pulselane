import { formatBooleanLabel, formatPeriodEnd, formatUsageLimit } from '@/lib/formatters'
import type { SessionListResponse } from '@pulselane/contracts/auth'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

export type DashboardMetric = {
  label: string
  value: string
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
          value: currentOrganization.currentRole
        }
      ]
    },
    {
      title: 'Plan and billing',
      description: 'Current subscription state for the active organization.',
      metrics: [
        {
          label: 'Plan',
          value: billing.plan
        },
        {
          label: 'Status',
          value: billing.status
        },
        {
          label: 'Period end',
          value: formatPeriodEnd(billing.currentPeriodEnd)
        },
        {
          label: 'Cancel at period end',
          value: formatBooleanLabel(billing.cancelAtPeriodEnd)
        },
        {
          label: 'Stripe customer',
          value: currentBilling ? formatConfiguredLabel(currentBilling.stripeCustomerConfigured) : 'Unavailable'
        },
        {
          label: 'Stripe subscription',
          value: currentBilling ? formatConfiguredLabel(currentBilling.stripeSubscriptionConfigured) : 'Unavailable'
        }
      ]
    },
    {
      title: 'Usage and limits',
      description: 'Backend-enforced plan usage for the active organization.',
      metrics: [
        {
          label: 'Members usage',
          value: formatUsageLimit(currentOrganization.usage.members, currentOrganization.limits.members)
        },
        {
          label: 'Clients usage',
          value: formatUsageLimit(currentOrganization.usage.clients, currentOrganization.limits.clients)
        },
        {
          label: 'Projects usage',
          value: formatUsageLimit(currentOrganization.usage.projects, currentOrganization.limits.projects)
        },
        {
          label: 'Active tasks usage',
          value: formatUsageLimit(currentOrganization.usage.activeTasks, currentOrganization.limits.activeTasks)
        }
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
        value: 'Unavailable'
      },
      {
        label: 'Other devices',
        value: 'Unavailable'
      },
      {
        label: 'Current session',
        value: 'Unavailable'
      }
    ]
  }

  const activeSessions = sessions.filter(session => session.isActive && !session.revokedAt)
  const otherActiveSessions = activeSessions.filter(session => !session.isCurrent)

  return [
    {
      label: 'Active sessions',
      value: String(activeSessions.length)
    },
    {
      label: 'Other devices',
      value: String(otherActiveSessions.length)
    },
    {
      label: 'Current session',
      value: activeSessions.some(session => session.isCurrent) ? 'Detected' : 'Not detected'
    }
  ]
}

function formatConfiguredLabel(value: boolean) {
  return value ? 'Configured' : 'Missing'
}
