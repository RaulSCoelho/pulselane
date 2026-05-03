import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { getBillingPlans } from '@/features/billing/api/server-queries'
import { BillingPlansGrid } from '@/features/billing/components/billing-plans-grid'
import { BillingPortalButton } from '@/features/billing/components/billing-portal-button'
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
      <PageHeader
        eyebrow="Plan and billing"
        title="Billing"
        description="Compare plan limits and start Stripe checkout or portal sessions when available."
      />

      {!canManage ? (
        <Card className="border border-border">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">
              Your role can inspect billing, but only owners and admins can start checkout or open the billing portal.
            </p>
          </Card.Content>
        </Card>
      ) : null}

      {billingState.status === 'ready' ? (
        <>
          <SectionCard
            title="Billing portal"
            description="Stripe redirects are not treated as payment confirmation. The backend webhook remains the source of truth."
            contentClassName="flex justify-end p-8"
          >
            <BillingPortalButton
              canManage={canManage}
              isAvailable={billingState.data.current.stripeCustomerConfigured}
            />
          </SectionCard>

          <BillingPlansGrid plans={billingState.data.plans} canManage={canManage} />
        </>
      ) : (
        <BillingUnavailableState reason={billingState.reason} />
      )}
    </div>
  )
}
