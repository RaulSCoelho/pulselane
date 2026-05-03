import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { requireAuth } from '@/features/auth/api/server-queries'
import { getBillingPlans } from '@/features/billing/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { buildOrganizationDashboardMetricGroups } from '@/features/organizations/dashboard-metrics'
import { listSessions } from '@/features/sessions/api/server-queries'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'

export default async function AppHomePage() {
  const me = await requireAuth({ redirectTo: APP_HOME_PATH })
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const [billingState, sessionsState] = await Promise.all([getBillingPlans(), listSessions(me.id)])
  const metricGroups = buildOrganizationDashboardMetricGroups({
    currentOrganization,
    currentBilling: billingState.status === 'ready' ? billingState.data.current : null,
    sessions: sessionsState.status === 'ready' ? sessionsState.data : null
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dashboard"
        title={currentOrganization.organization.name}
        description={`Active workspace for ${me.name}. Metrics for the current organization are centralized here.`}
      />

      {metricGroups.map(group => (
        <SectionCard
          key={group.title}
          title={group.title}
          description={group.description}
          contentClassName="grid gap-3 p-8 sm:grid-cols-2 xl:grid-cols-3"
        >
          {group.metrics.map(metric => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </SectionCard>
      ))}
    </div>
  )
}
