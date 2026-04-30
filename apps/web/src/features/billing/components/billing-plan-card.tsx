import { StatusPill } from '@/components/ui/data-table-card'
import { KeyValueListCard } from '@/components/ui/metric-card'
import { BillingPlanActionForm } from '@/features/billing/components/billing-plan-action-form'
import { formatLimit } from '@/lib/formatters'
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

export function BillingPlanCard({ plan, canManage }: BillingPlanCardProps) {
  return (
    <Card className="border border-border">
      <Card.Header className="flex flex-col gap-3 p-6 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Card.Title className="text-2xl font-semibold tracking-normal">{plan.displayName}</Card.Title>
            <Card.Description className="text-sm leading-6 text-muted">{plan.description}</Card.Description>
          </div>

          {plan.isCurrent ? <StatusPill>Current</StatusPill> : null}
        </div>

        <div>
          <p className="text-2xl font-semibold tracking-normal">{formatPrice(plan)}</p>
          <p className="text-sm text-muted">{plan.isFree ? 'No billing interval' : `per ${plan.billingInterval}`}</p>
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6 p-6">
        <KeyValueListCard
          items={[
            { label: 'Members', value: formatLimit(plan.limits.members) },
            { label: 'Clients', value: formatLimit(plan.limits.clients) },
            { label: 'Projects', value: formatLimit(plan.limits.projects) },
            { label: 'Active tasks', value: formatLimit(plan.limits.active_tasks) }
          ]}
        />

        <BillingPlanActionForm plan={plan} canManage={canManage} />
      </Card.Content>
    </Card>
  )
}
