import { PageHeader } from '@/components/ui/page-header'
import { listClients } from '@/features/clients/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { ProjectCreateForm } from '@/features/projects/components/project-create-form'
import { ProjectsTable } from '@/features/projects/components/projects-table'
import { canCreateProjects } from '@/lib/projects/project-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'
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
      />

      {allowCreate && clients.length > 0 ? <ProjectCreateForm clients={clients} /> : null}

      {allowCreate && clients.length === 0 ? (
        <Card className="min-w-0 border border-border shadow-surface">
          <Card.Content className="flex min-w-0 flex-col gap-3 p-5 sm:p-6">
            <h2 className="text-xl font-medium tracking-normal">Create a client first</h2>
            <p className="text-sm leading-6 text-muted">
              Projects require an active client. Create a client before starting project work.
            </p>
            <div className="flex justify-stretch sm:justify-start">
              <Link href="/app/clients" className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
                Go to clients
              </Link>
            </div>
          </Card.Content>
        </Card>
      ) : null}

      <ProjectsTable currentRole={currentOrganization.currentRole} clients={clients} />
    </div>
  )
}
