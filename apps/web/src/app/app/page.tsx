import { OrganizationContextEmptyState } from '@/components/organizations/organization-context-empty-state'
import { requireAuth } from '@/lib/auth/auth-guard'
import { getCurrentOrganization } from '@/lib/organizations/current-organization'
import { Card } from '@heroui/react'

export default async function AppHomePage() {
  const me = await requireAuth({ redirectTo: '/app' })
  const currentOrganization = await getCurrentOrganization()

  if (!currentOrganization) {
    return <OrganizationContextEmptyState />
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5 shadow-sm">
        <Card.Content className="flex flex-col gap-6 p-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Overview</span>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {currentOrganization.organization.name}
            </h1>
            <p className="text-sm text-zinc-600">
              Active workspace for {me.name}. The operational modules can now rely on a stable organization context.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-zinc-500">Plan</p>
              <p className="mt-1 font-medium text-zinc-950">{currentOrganization.plan.plan}</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-zinc-500">Role</p>
              <p className="mt-1 font-medium text-zinc-950">{currentOrganization.currentRole}</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-zinc-500">Projects usage</p>
              <p className="mt-1 font-medium text-zinc-950">
                {currentOrganization.usage.projects}
                {currentOrganization.limits.projects !== null ? ` / ${currentOrganization.limits.projects}` : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-zinc-500">Active tasks usage</p>
              <p className="mt-1 font-medium text-zinc-950">
                {currentOrganization.usage.activeTasks}
                {currentOrganization.limits.activeTasks !== null ? ` / ${currentOrganization.limits.activeTasks}` : ''}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-black/5 shadow-sm">
        <Card.Content className="flex flex-col gap-4 p-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Next operational modules</h2>
          <p className="text-sm leading-6 text-zinc-600">
            With authentication and organization context closed, the frontend can move to clients, projects and tasks
            without reworking the shell or tenant flow.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
