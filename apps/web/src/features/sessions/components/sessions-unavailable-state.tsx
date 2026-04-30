import type { SessionsUnavailableReason } from '@/features/sessions/api/server-queries'
import { Card } from '@heroui/react'

type SessionsUnavailableStateProps = {
  reason: SessionsUnavailableReason
}

const reasonMessage: Record<SessionsUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached. Try again shortly.',
  server_error: 'The API returned an error. Try again shortly.',
  network_error: 'The API could not be reached. Try again shortly.',
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
