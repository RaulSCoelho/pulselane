import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { buildOrganizationDashboardMetricGroups, organizationDashboardMetricLabels } from './dashboard-metrics.ts'

const currentOrganization = {
  organization: {
    id: 'org-1',
    name: 'Acme Ops',
    slug: 'acme-ops'
  },
  currentRole: 'owner',
  plan: {
    plan: 'free',
    status: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  },
  limits: {
    members: 3,
    clients: 10,
    projects: 10,
    activeTasks: 100
  },
  usage: {
    members: 1,
    clients: 2,
    projects: 3,
    activeTasks: 4
  }
}

const currentBilling = {
  plan: 'starter',
  status: 'active',
  cancelAtPeriodEnd: true,
  currentPeriodEnd: '2026-04-30T00:00:00.000Z',
  stripeCustomerConfigured: true,
  stripeSubscriptionConfigured: false
}

const sessions = [
  {
    id: 'session-1',
    deviceId: 'device-1',
    userAgent: 'Browser',
    ipAddress: '127.0.0.1',
    createdAt: '2026-04-01T00:00:00.000Z',
    lastUsedAt: '2026-04-01T00:00:00.000Z',
    expiresAt: '2026-05-01T00:00:00.000Z',
    revokedAt: null,
    compromisedAt: null,
    isCurrent: true,
    isActive: true
  },
  {
    id: 'session-2',
    deviceId: 'device-2',
    userAgent: 'Browser',
    ipAddress: '127.0.0.2',
    createdAt: '2026-04-01T00:00:00.000Z',
    lastUsedAt: '2026-04-01T00:00:00.000Z',
    expiresAt: '2026-05-01T00:00:00.000Z',
    revokedAt: null,
    compromisedAt: null,
    isCurrent: false,
    isActive: true
  }
]

test('dashboard exposes every expected organization metric once', () => {
  const groups = buildOrganizationDashboardMetricGroups({
    currentOrganization,
    currentBilling,
    sessions
  })

  const labels = groups.flatMap(group => group.metrics.map(metric => metric.label))
  const expectedLabels = Object.values(organizationDashboardMetricLabels).flat()

  assert.deepEqual(labels, expectedLabels)
  assert.equal(new Set(labels).size, labels.length)
})

test('dashboard formats usage, billing and session metric values from the active context', () => {
  const groups = buildOrganizationDashboardMetricGroups({
    currentOrganization,
    currentBilling,
    sessions
  })

  const metrics = Object.fromEntries(groups.flatMap(group => group.metrics.map(metric => [metric.label, metric.value])))

  assert.equal(metrics.Organization, 'Acme Ops')
  assert.equal(metrics['Current role'], 'owner')
  assert.equal(metrics.Plan, 'starter')
  assert.equal(metrics['Cancel at period end'], 'Yes')
  assert.equal(metrics['Stripe customer'], 'Configured')
  assert.equal(metrics['Stripe subscription'], 'Missing')
  assert.equal(metrics['Members usage'], '1 / 3')
  assert.equal(metrics['Clients usage'], '2 / 10')
  assert.equal(metrics['Projects usage'], '3 / 10')
  assert.equal(metrics['Active tasks usage'], '4 / 100')
  assert.equal(metrics['Active sessions'], '2')
  assert.equal(metrics['Other devices'], '1')
  assert.equal(metrics['Current session'], 'Detected')
})

test('dashboard marks usage metrics near or above limits as danger', () => {
  const groups = buildOrganizationDashboardMetricGroups({
    currentOrganization: {
      ...currentOrganization,
      usage: {
        ...currentOrganization.usage,
        members: 3,
        clients: 10
      }
    },
    currentBilling,
    sessions
  })

  const metrics = Object.fromEntries(groups.flatMap(group => group.metrics.map(metric => [metric.label, metric])))

  assert.equal(metrics['Members usage'].tone, 'danger')
  assert.equal(metrics['Clients usage'].tone, 'danger')
})

test('legacy pages no longer render duplicated dashboard metrics', () => {
  const dashboardPage = readFileSync('src/app/app/page.tsx', 'utf8')

  assert.equal(dashboardPage.includes('buildOrganizationDashboardMetricGroups'), true)
  assert.equal(dashboardPage.includes('metricGroups.map'), true)
  assert.equal(dashboardPage.includes('<MetricCard'), true)

  const legacyAssertions = [
    {
      file: 'src/app/app/clients/page.tsx',
      forbidden: ['metrics={[', 'Clients usage']
    },
    {
      file: 'src/app/app/projects/page.tsx',
      forbidden: ['metrics={[', 'Projects usage']
    },
    {
      file: 'src/app/app/tasks/page.tsx',
      forbidden: ['metrics={[', 'Tasks usage']
    },
    {
      file: 'src/app/app/members/page.tsx',
      forbidden: ['Members usage', 'Loaded now']
    },
    {
      file: 'src/app/app/invitations/page.tsx',
      forbidden: ['Members usage', 'Loaded now']
    },
    {
      file: 'src/app/app/audit-logs/page.tsx',
      forbidden: ['Loaded now']
    },
    {
      file: 'src/app/app/organization/page.tsx',
      forbidden: ['OrganizationPlanCard', 'OrganizationUsageCard', 'Usage and limits']
    },
    {
      file: 'src/app/app/billing/page.tsx',
      forbidden: ['BillingCurrentSummaryCard', 'Current subscription']
    },
    {
      file: 'src/app/app/sessions/page.tsx',
      forbidden: ['Active sessions</p>', 'Other devices</p>', 'Current session</p>']
    }
  ]

  for (const assertion of legacyAssertions) {
    const content = readFileSync(assertion.file, 'utf8')

    for (const forbidden of assertion.forbidden) {
      assert.equal(content.includes(forbidden), false, `${assertion.file} still contains ${forbidden}`)
    }
  }

  assert.equal(existsSync('src/features/organizations/components/organization-plan-card.tsx'), false)
  assert.equal(existsSync('src/features/organizations/components/organization-usage-card.tsx'), false)
  assert.equal(existsSync('src/features/billing/components/billing-current-summary-card.tsx'), false)
})
