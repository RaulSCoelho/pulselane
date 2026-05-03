import { PageHeader } from '@/components/ui/page-header'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { OrganizationSettingsForm } from '@/features/organizations/components/organization-settings-form'
import { canUpdateOrganization } from '@/lib/organizations/organization-permissions'

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
      <PageHeader
        eyebrow="Tenant settings"
        title="Organization settings"
        description="Manage the current organization identity and tenant-facing settings."
      />

      <OrganizationSettingsForm currentOrganization={currentOrganization} canEdit={canEdit} />
    </div>
  )
}
