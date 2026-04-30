import { getBillingPlans } from '@/features/billing/api/server-queries'
import { BillingCurrentSummaryCard } from '@/features/billing/components/billing-current-summary-card'
import { BillingPlansGrid } from '@/features/billing/components/billing-plans-grid'
import { BillingUnavailableState } from '@/features/billing/components/billing-unavailable-state'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { canManageBilling } from '@/lib/billing/billing-permissions'
import { Card } from '@heroui/react'

export default async function BillingPage() {
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data
  const billingState = await getBillingPlans()
  const canManage = canManageBilling(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Plan and billing</span>
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Review the active subscription, compare plan limits and start Stripe checkout or portal sessions when
              available.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current role</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.currentRole}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Organization</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.organization.name}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Plan</p>
                <p className="mt-2 text-sm font-medium">
                  {billingState.status === 'ready' ? billingState.data.current.plan : currentOrganization.plan.plan}
                </p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      {!canManage ? (
        <Card className="border border-black/5">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">
              Your role can inspect billing, but only owners and admins can start checkout or open the billing portal.
            </p>
          </Card.Content>
        </Card>
      ) : null}

      {billingState.status === 'ready' ? (
        <>
          <BillingCurrentSummaryCard billing={billingState.data.current} canManage={canManage} />

          <BillingPlansGrid plans={billingState.data.plans} canManage={canManage} />
        </>
      ) : (
        <BillingUnavailableState reason={billingState.reason} />
      )}
    </div>
  )
}
