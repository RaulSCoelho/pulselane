import { PageHeader } from '@/components/ui/page-header'
import { listClients } from '@/features/clients/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { ProjectCreateModal } from '@/features/projects/components/project-create-modal'
import { ProjectsTable } from '@/features/projects/components/projects-table'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { canCreateProjects } from '@/lib/projects/project-permissions'
import { buttonVariants } from '@heroui/react'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default async function ProjectsPage() {
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const clientsState = await listClients(
    listClientsQuerySchema.parse({
      limit: '100',
      includeArchived: false
    })
  )
  const clients = clientsState.status === 'ready' ? clientsState.data.items : []
  const allowCreate = canCreateProjects(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operational module"
        title="Projects"
        description="Connect client ownership to execution. Keep scope, status and delivery context visible."
        actions={
          allowCreate && clients.length > 0 ? (
            <ProjectCreateModal clients={clients} />
          ) : allowCreate ? (
            <Link href={CLIENTS_PATH} className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
              <Users aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Create client first
            </Link>
          ) : null
        }
      />

      <ProjectsTable currentRole={currentOrganization.currentRole} clients={clients} />
    </div>
  )
}
