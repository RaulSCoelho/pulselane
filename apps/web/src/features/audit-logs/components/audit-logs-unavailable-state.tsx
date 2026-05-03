import type { AuditLogsUnavailableReason } from '@/features/audit-logs/api/server-queries'
import { Card } from '@heroui/react'

type AuditLogsUnavailableStateProps = {
  reason: AuditLogsUnavailableReason
}

const reasonMessage: Record<AuditLogsUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached. Try again shortly.',
  server_error: 'The API returned an error. Try again shortly.',
  network_error: 'The API could not be reached. Try again shortly.',
  unexpected_response: 'The audit logs response could not be validated safely.'
}

export function AuditLogsUnavailableState({ reason }: AuditLogsUnavailableStateProps) {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">Audit logs temporarily unavailable</h2>
        <p className="text-sm leading-6 text-muted">{reasonMessage[reason]}</p>
      </Card.Content>
    </Card>
  )
}
