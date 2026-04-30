import type { ClientsUnavailableReason } from '@/features/clients/api/clients-list-state'
import { Alert, Card } from '@heroui/react'

type ClientsUnavailableStateProps = {
  reason: ClientsUnavailableReason
}

export function ClientsUnavailableState({ reason }: ClientsUnavailableStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-4 p-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Clients</span>
          <h2 className="text-2xl font-semibold tracking-tight">Clients temporarily unavailable</h2>
          <p className="text-sm leading-6 text-muted">{getClientsUnavailableDescription(reason)}</p>
        </div>

        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Try again shortly</Alert.Title>
            <Alert.Description>Cached clients data will be reused by the server when available.</Alert.Description>
          </Alert.Content>
        </Alert>
      </Card.Content>
    </Card>
  )
}

function getClientsUnavailableDescription(reason: ClientsUnavailableReason) {
  if (reason === 'rate_limited') {
    return 'The clients list is being rate limited right now. Try again shortly.'
  }

  if (reason === 'network_error') {
    return 'The clients list could not be reached right now. Try again shortly.'
  }

  return 'The clients list could not be loaded right now. Try again shortly.'
}
