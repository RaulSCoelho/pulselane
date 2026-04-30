import type { BillingPlansUnavailableReason } from '@/features/billing/api/server-queries'
import { Card } from '@heroui/react'

type BillingUnavailableStateProps = {
  reason: BillingPlansUnavailableReason
}

const reasonMessage: Record<BillingPlansUnavailableReason, string> = {
  rate_limited: 'The API rate limit was reached. Try again shortly.',
  server_error: 'The API returned an error. Try again shortly.',
  network_error: 'The API could not be reached. Try again shortly.',
  unexpected_response: 'The billing response could not be validated safely.'
}

export function BillingUnavailableState({ reason }: BillingUnavailableStateProps) {
  return (
    <Card className="border border-border">
      <Card.Content className="flex flex-col gap-2 p-8">
        <h2 className="text-xl font-medium tracking-normal">Billing temporarily unavailable</h2>
        <p className="text-sm leading-6 text-muted">{reasonMessage[reason]}</p>
      </Card.Content>
    </Card>
  )
}
