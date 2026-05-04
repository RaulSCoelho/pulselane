import { PageHeader } from '@/components/ui/page-header'
import { ClientCreateModal } from '@/features/clients/components/client-create-modal'
import { ClientsTable } from '@/features/clients/components/clients-table'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { canCreateClients } from '@/lib/clients/client-permissions'

export default async function ClientsPage() {
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const allowCreate = canCreateClients(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operational module"
        title="Clients"
        description="Manage the operational entities that unlock project structure and execution flow."
        actions={allowCreate ? <ClientCreateModal /> : null}
      />

      <ClientsTable currentRole={currentOrganization.currentRole} />
    </div>
  )
}
