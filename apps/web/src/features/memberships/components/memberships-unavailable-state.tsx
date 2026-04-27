import type { MembershipsUnavailableReason } from '@/features/memberships/api/server-queries'
import { Card } from '@heroui/react'

type MembershipsUnavailableStateProps = {
  reason: MembershipsUnavailableReason
}

const reasonMessage: Record<MembershipsUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached and no valid members snapshot is available.',
  server_error: 'The API returned an error and no valid members snapshot is available.',
  network_error: 'The API could not be reached and no valid members snapshot is available.',
  unexpected_response: 'The members response could not be validated safely.'
}

export function MembershipsUnavailableState({ reason }: MembershipsUnavailableStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8">
        <h2 className="text-xl font-semibold tracking-tight">Members temporarily unavailable</h2>
        <p className="text-sm leading-6 text-muted">{reasonMessage[reason]}</p>
      </Card.Content>
    </Card>
  )
}
