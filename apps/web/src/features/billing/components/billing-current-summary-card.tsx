import { MetricCard } from '@/components/ui/metric-card'
import { SectionCard } from '@/components/ui/section-card'
import { BillingPortalButton } from '@/features/billing/components/billing-portal-button'
import { formatBooleanLabel, formatPeriodEnd } from '@/lib/formatters'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'

type BillingCurrentSummaryCardProps = {
  billing: BillingPlansResponse['current']
  canManage: boolean
}

export function BillingCurrentSummaryCard({ billing, canManage }: BillingCurrentSummaryCardProps) {
  const portalAvailable = billing.stripeCustomerConfigured

  return (
    <SectionCard
      title="Current subscription"
      description="Stripe redirects are not treated as payment confirmation. The backend webhook remains the source of truth."
      contentClassName="flex flex-col gap-6 p-8"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Plan" value={billing.plan} />
        <MetricCard label="Status" value={billing.status} />
        <MetricCard label="Period end" value={formatPeriodEnd(billing.currentPeriodEnd)} />
        <MetricCard label="Customer" value={billing.stripeCustomerConfigured ? 'Configured' : 'Missing'} />
        <MetricCard label="Cancel at period end" value={formatBooleanLabel(billing.cancelAtPeriodEnd)} />
      </div>

      <div className="flex justify-end">
        <BillingPortalButton canManage={canManage} isAvailable={portalAvailable} />
      </div>
    </SectionCard>
  )
}
