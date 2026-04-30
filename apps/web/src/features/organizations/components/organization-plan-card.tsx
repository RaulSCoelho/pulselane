import { MetricCard } from '@/components/ui/metric-card'
import { SectionCard } from '@/components/ui/section-card'
import { formatBooleanLabel, formatPeriodEnd } from '@/lib/formatters'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

type OrganizationPlanCardProps = {
  currentOrganization: CurrentOrganizationResponse
}

export function OrganizationPlanCard({ currentOrganization }: OrganizationPlanCardProps) {
  return (
    <SectionCard
      title="Plan"
      description="Current billing state and plan metadata for this organization."
      contentClassName="grid gap-3 p-8 sm:grid-cols-2 lg:grid-cols-4"
    >
      <MetricCard label="Plan" value={currentOrganization.plan.plan} />
      <MetricCard label="Status" value={currentOrganization.plan.status} />
      <MetricCard label="Period end" value={formatPeriodEnd(currentOrganization.plan.currentPeriodEnd)} />
      <MetricCard label="Cancel at period end" value={formatBooleanLabel(currentOrganization.plan.cancelAtPeriodEnd)} />
    </SectionCard>
  )
}
