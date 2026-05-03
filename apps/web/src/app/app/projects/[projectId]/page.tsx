import { listClients } from '@/features/clients/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { getProjectById } from '@/features/projects/api/server-queries'
import { ProjectEditForm } from '@/features/projects/components/project-edit-form'
import { canEditProjects } from '@/lib/projects/project-permissions'
import { Alert, Card } from '@heroui/react'
import { listClientsQuerySchema } from '@pulselane/contracts/clients'

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const project = await getProjectById(projectId)
  const canEdit = canEditProjects(currentOrganization.currentRole)

  const clientsState = await listClients(
    listClientsQuerySchema.parse({
      limit: '100',
      includeArchived: false
    })
  )

  const clients = clientsState.status === 'ready' ? clientsState.data.items : []

  return (
    <div className="flex flex-col gap-6">
      <Card className="min-w-0 border border-border">
        <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Project record</span>
            <h1 className="font-semibold tracking-normal">{project.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Review the current project state and update it without bypassing tenant or concurrency safeguards.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:min-w-80 sm:grid-cols-2 lg:w-auto">
            <Card className="min-w-0 border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
                <p className="mt-2 text-sm font-medium">{project.status}</p>
              </Card.Content>
            </Card>

            <Card className="min-w-0 border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Client</p>
                <p className="mt-2 text-sm font-medium">{project.client.name}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      {!canEdit ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Read-only access</Alert.Title>
            <Alert.Description>Your role can inspect this project, but cannot edit it.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <ProjectEditForm project={project} clients={clients} canEdit={canEdit} />
    </div>
  )
}
