import type { InvitationsUnavailableReason } from '@/features/invitations/api/server-queries'
import { Card } from '@heroui/react'

type InvitationsUnavailableStateProps = {
  reason: InvitationsUnavailableReason
}

const reasonMessage: Record<InvitationsUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached. Try again shortly.',
  server_error: 'The API returned an error. Try again shortly.',
  network_error: 'The API could not be reached. Try again shortly.',
  unexpected_response: 'The invitations response could not be validated safely.'
}

export function InvitationsUnavailableState({ reason }: InvitationsUnavailableStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8">
        <h2 className="text-xl font-semibold tracking-tight">Invitations temporarily unavailable</h2>
        <p className="text-sm leading-6 text-muted">{reasonMessage[reason]}</p>
      </Card.Content>
    </Card>
  )
}
