import { BillingPlanActionForm } from '@/features/billing/components/billing-plan-action-form'
import { Card } from '@heroui/react'
import type { BillingPlanCatalogItem } from '@pulselane/contracts/billing'

type BillingPlanCardProps = {
  plan: BillingPlanCatalogItem
  canManage: boolean
}

function formatPrice(plan: BillingPlanCatalogItem) {
  if (plan.isFree) {
    return 'Free'
  }

  const amount = plan.monthlyPriceCents / 100

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: plan.currency
  }).format(amount)
}

function formatLimit(value: number | null) {
  return value === null ? 'Unlimited' : String(value)
}

export function BillingPlanCard({ plan, canManage }: BillingPlanCardProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-3 p-6 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Card.Title className="text-2xl font-semibold tracking-tight">{plan.displayName}</Card.Title>
            <Card.Description className="text-sm leading-6 text-muted">{plan.description}</Card.Description>
          </div>

          {plan.isCurrent ? (
            <span className="rounded-full border px-3 py-1 text-xs font-medium text-foreground">Current</span>
          ) : null}
        </div>

        <div>
          <p className="text-3xl font-semibold tracking-tight">{formatPrice(plan)}</p>
          <p className="text-sm text-muted">{plan.isFree ? 'No billing interval' : `per ${plan.billingInterval}`}</p>
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6 p-6">
        <div className="grid gap-3">
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="grid grid-cols-2 gap-3 p-4 text-sm">
              <span className="text-muted">Members</span>
              <span className="text-right font-medium">{formatLimit(plan.limits.members)}</span>

              <span className="text-muted">Clients</span>
              <span className="text-right font-medium">{formatLimit(plan.limits.clients)}</span>

              <span className="text-muted">Projects</span>
              <span className="text-right font-medium">{formatLimit(plan.limits.projects)}</span>

              <span className="text-muted">Active tasks</span>
              <span className="text-right font-medium">{formatLimit(plan.limits.active_tasks)}</span>
            </Card.Content>
          </Card>
        </div>

        <BillingPlanActionForm plan={plan} canManage={canManage} />
      </Card.Content>
    </Card>
  )
}
