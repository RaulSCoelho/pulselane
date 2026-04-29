import { BillingPortalButton } from '@/features/billing/components/billing-portal-button'
import { Card } from '@heroui/react'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'

type BillingCurrentSummaryCardProps = {
  billing: BillingPlansResponse['current']
  canManage: boolean
}

function formatPeriodEnd(value: string | null) {
  if (!value) {
    return 'No period end'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function BillingCurrentSummaryCard({ billing, canManage }: BillingCurrentSummaryCardProps) {
  const portalAvailable = billing.stripeCustomerConfigured

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Current subscription</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Stripe redirects are not treated as payment confirmation. The backend webhook remains the source of truth.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6 p-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Plan</p>
              <p className="mt-2 text-sm font-medium">{billing.plan}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
              <p className="mt-2 text-sm font-medium">{billing.status}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Period end</p>
              <p className="mt-2 text-sm font-medium">{formatPeriodEnd(billing.currentPeriodEnd)}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Customer</p>
              <p className="mt-2 text-sm font-medium">{billing.stripeCustomerConfigured ? 'Configured' : 'Missing'}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Cancel at period end</p>
              <p className="mt-2 text-sm font-medium">{billing.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
            </Card.Content>
          </Card>
        </div>

        <div className="flex justify-end">
          <BillingPortalButton canManage={canManage} isAvailable={portalAvailable} />
        </div>
      </Card.Content>
    </Card>
  )
}
