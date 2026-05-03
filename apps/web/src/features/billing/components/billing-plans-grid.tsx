import { SectionCard } from '@/components/ui/section-card'
import { BillingPlanCard } from '@/features/billing/components/billing-plan-card'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'

type BillingPlansGridProps = {
  plans: BillingPlansResponse['plans']
  canManage: boolean
}

export function BillingPlansGrid({ plans, canManage }: BillingPlansGridProps) {
  return (
    <SectionCard
      title="Available plans"
      description="Choose a plan based on operational limits. Enforcement stays in the backend, not in this UI."
      contentClassName="grid gap-4 p-5 sm:p-8 xl:grid-cols-3"
    >
      {plans.map(plan => (
        <BillingPlanCard key={plan.plan} plan={plan} canManage={canManage} />
      ))}
    </SectionCard>
  )
}
