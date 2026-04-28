import { Card } from '@heroui/react'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

type OrganizationPlanCardProps = {
  currentOrganization: CurrentOrganizationResponse
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

export function OrganizationPlanCard({ currentOrganization }: OrganizationPlanCardProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Plan</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Current billing state and plan metadata for this organization.
        </Card.Description>
      </Card.Header>

      <Card.Content className="grid gap-3 p-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-black/5" variant="secondary">
          <Card.Content className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Plan</p>
            <p className="mt-2 text-sm font-medium">{currentOrganization.plan.plan}</p>
          </Card.Content>
        </Card>

        <Card className="border border-black/5" variant="secondary">
          <Card.Content className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
            <p className="mt-2 text-sm font-medium">{currentOrganization.plan.status}</p>
          </Card.Content>
        </Card>

        <Card className="border border-black/5" variant="secondary">
          <Card.Content className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Period end</p>
            <p className="mt-2 text-sm font-medium">{formatPeriodEnd(currentOrganization.plan.currentPeriodEnd)}</p>
          </Card.Content>
        </Card>

        <Card className="border border-black/5" variant="secondary">
          <Card.Content className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Cancel at period end</p>
            <p className="mt-2 text-sm font-medium">{currentOrganization.plan.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
          </Card.Content>
        </Card>
      </Card.Content>
    </Card>
  )
}
