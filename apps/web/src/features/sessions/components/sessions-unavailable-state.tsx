import type { SessionsUnavailableReason } from '@/features/sessions/api/server-queries'
import { Card } from '@heroui/react'

type SessionsUnavailableStateProps = {
  reason: SessionsUnavailableReason
}

const reasonMessage: Record<SessionsUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached and no valid sessions snapshot is available.',
  server_error: 'The API returned an error and no valid sessions snapshot is available.',
  network_error: 'The API could not be reached and no valid sessions snapshot is available.',
  unexpected_response: 'The sessions response could not be validated safely.'
}

export function SessionsUnavailableState({ reason }: SessionsUnavailableStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8">
        <h2 className="text-xl font-semibold tracking-tight">Sessions temporarily unavailable</h2>
        <p className="text-sm leading-6 text-muted">{reasonMessage[reason]}</p>
      </Card.Content>
    </Card>
  )
}
