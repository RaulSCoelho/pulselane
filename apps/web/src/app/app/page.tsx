import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { listAuditLogs } from '@/features/audit-logs/api/server-queries'
import { requireAuth } from '@/features/auth/api/server-queries'
import { getBillingPlans } from '@/features/billing/api/server-queries'
import { listClients } from '@/features/clients/api/server-queries'
import { listMemberships } from '@/features/memberships/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { DashboardQuickActions } from '@/features/organizations/components/dashboard-quick-actions'
import { DashboardRecentAuditLogs } from '@/features/organizations/components/dashboard-recent-audit-logs'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { buildOrganizationDashboardMetricGroups } from '@/features/organizations/dashboard-metrics'
import { listProjects } from '@/features/projects/api/server-queries'
import { listSessions } from '@/features/sessions/api/server-queries'
import { canReadAuditLogs } from '@/lib/audit-logs/audit-log-permissions'
import { canCreateClients } from '@/lib/clients/client-permissions'
import { canCreateInvitations } from '@/lib/invitations/invitation-permissions'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { canCreateProjects } from '@/lib/projects/project-permissions'
import { canCreateTasks } from '@/lib/tasks/task-permissions'
import { listAuditLogsQuerySchema } from '@pulselane/contracts/audit-logs'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'
import { listMembershipsQuerySchema } from '@pulselane/contracts/memberships'
import { listProjectsQuerySchema } from '@pulselane/contracts/projects'

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
  const allowReadAuditLogs = canReadAuditLogs(currentOrganization.currentRole)
  const [billingState, sessionsState, clientsState, projectsState, membershipsState, auditLogsState] =
    await Promise.all([
      getBillingPlans(),
      listSessions(me.id),
      listClients(
        listClientsQuerySchema.parse({
          limit: '100',
          includeArchived: false
        })
      ),
      listProjects(
        listProjectsQuerySchema.parse({
          limit: '100',
          includeArchived: false
        })
      ),
      listMemberships(
        listMembershipsQuerySchema.parse({
          limit: '100'
        })
      ),
      allowReadAuditLogs
        ? listAuditLogs(
            listAuditLogsQuerySchema.parse({
              limit: '5'
            })
          )
        : Promise.resolve(null)
    ])
  const clients = clientsState.status === 'ready' ? clientsState.data.items : []
  const projects = projectsState.status === 'ready' ? projectsState.data.items : []
  const memberships = membershipsState.status === 'ready' ? membershipsState.data.items : []
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

      <DashboardQuickActions
        clients={clients}
        projects={projects}
        memberships={memberships}
        canCreateClients={canCreateClients(currentOrganization.currentRole)}
        canCreateProjects={canCreateProjects(currentOrganization.currentRole)}
        canCreateTasks={canCreateTasks(currentOrganization.currentRole)}
        canCreateInvitations={canCreateInvitations(currentOrganization.currentRole)}
        clientsReady={clientsState.status === 'ready'}
        projectsReady={projectsState.status === 'ready'}
      />

      <DashboardRecentAuditLogs auditLogsState={auditLogsState} canRead={allowReadAuditLogs} />

      {metricGroups.map(group => (
        <SectionCard
          key={group.title}
          title={group.title}
          description={group.description}
          contentClassName="grid gap-3 p-5 sm:grid-cols-2 sm:p-8 xl:grid-cols-3"
        >
          {group.metrics.map(metric => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
              meter={metric.meter}
            />
          ))}
        </SectionCard>
      ))}
    </div>
  )
}
