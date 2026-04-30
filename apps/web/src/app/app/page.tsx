import { requireAuth } from '@/features/auth/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Card } from '@heroui/react'

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

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border">
        <Card.Content className="flex flex-col gap-6 p-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Overview</span>
            <h1 className="font-semibold tracking-normal">{currentOrganization.organization.name}</h1>
            <p className="text-sm text-muted">
              Active workspace for {me.name}. The operational modules can now rely on a stable organization context.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Plan', currentOrganization.plan.plan],
              ['Role', currentOrganization.currentRole],
              [
                'Projects usage',
                `${currentOrganization.usage.projects}${currentOrganization.limits.projects !== null ? ` / ${currentOrganization.limits.projects}` : ''}`
              ],
              [
                'Active tasks usage',
                `${currentOrganization.usage.activeTasks}${currentOrganization.limits.activeTasks !== null ? ` / ${currentOrganization.limits.activeTasks}` : ''}`
              ]
            ].map(([label, value]) => (
              <Card key={label} className="border border-border" variant="secondary">
                <Card.Content className="p-4">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="flex flex-col gap-4 p-8">
          <h2 className="text-xl font-medium tracking-normal">Next operational modules</h2>
          <p className="text-sm leading-6 text-muted">
            With authentication and organization context closed, the frontend can move to clients, projects and tasks
            without reworking the shell or tenant flow.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
