import { getClientById } from '@/features/clients/api/server-queries'
import { ClientEditForm } from '@/features/clients/components/client-edit-form'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { canEditClients } from '@/lib/clients/client-permissions'
import { Alert, Card } from '@heroui/react'

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string
  }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

  const client = await getClientById(clientId)
  const canEdit = canEditClients(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <Card className="min-w-0 border border-border">
        <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Client record</span>
            <h1 className="font-semibold tracking-normal">{client.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Review the current state and update the client without bypassing concurrency safeguards.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:min-w-48 lg:w-auto">
            <Card className="min-w-0 border border-border" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
                <p className="mt-2 text-sm font-medium">{client.status}</p>
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
            <Alert.Description>Your role can inspect this client, but cannot edit it.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <ClientEditForm client={client} canEdit={canEdit} />
    </div>
  )
}
