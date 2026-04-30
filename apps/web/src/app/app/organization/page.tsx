import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { OrganizationPlanCard } from '@/features/organizations/components/organization-plan-card'
import { OrganizationSettingsForm } from '@/features/organizations/components/organization-settings-form'
import { OrganizationUsageCard } from '@/features/organizations/components/organization-usage-card'
import { canUpdateOrganization } from '@/lib/organizations/organization-permissions'
import { Card } from '@heroui/react'

export default async function OrganizationSettingsPage() {
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const canEdit = canUpdateOrganization(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tenant settings</span>
            <h1 className="text-3xl font-semibold tracking-tight">Organization settings</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Manage the current organization identity and inspect the plan, usage and limits attached to this tenant.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current role</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.currentRole}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Organization</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.organization.name}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Slug</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.organization.slug}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      <OrganizationSettingsForm currentOrganization={currentOrganization} canEdit={canEdit} />

      <OrganizationPlanCard currentOrganization={currentOrganization} />

      <OrganizationUsageCard currentOrganization={currentOrganization} />
    </div>
  )
}
