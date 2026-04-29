import { BillingPlanCard } from '@/features/billing/components/billing-plan-card'
import { Card } from '@heroui/react'
import type { BillingPlansResponse } from '@pulselane/contracts/billing'

type BillingPlansGridProps = {
  plans: BillingPlansResponse['plans']
  canManage: boolean
}

export function BillingPlansGrid({ plans, canManage }: BillingPlansGridProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Available plans</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Choose a plan based on operational limits. Enforcement stays in the backend, not in this UI.
        </Card.Description>
      </Card.Header>

      <Card.Content className="grid gap-4 p-8 xl:grid-cols-3">
        {plans.map(plan => (
          <BillingPlanCard key={plan.plan} plan={plan} canManage={canManage} />
        ))}
      </Card.Content>
    </Card>
  )
}
