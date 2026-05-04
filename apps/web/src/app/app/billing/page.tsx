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
import { Alert, Card } from '@heroui/react'

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type BillingRedirectNotice = {
  status: 'success' | 'warning' | 'danger'
  title: string
  description: string
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function getBillingRedirectNotice(
  searchParams: Record<string, string | string[] | undefined>
): BillingRedirectNotice | null {
  const checkout = readSearchParam(searchParams, 'checkout')
  const billing = readSearchParam(searchParams, 'billing')

  if (checkout === 'success') {
    return {
      status: 'success',
      title: 'Checkout completed',
      description: 'Stripe returned successfully. Billing changes appear after the webhook sync completes.'
    }
  }

  if (checkout === 'canceled' || checkout === 'cancelled') {
    return {
      status: 'warning',
      title: 'Checkout canceled',
      description: 'No billing change was made. You can start checkout again when you are ready.'
    }
  }

  if (checkout === 'error') {
    return {
      status: 'danger',
      title: 'Checkout could not be completed',
      description: 'Stripe returned an error state. Try again or open the billing portal if a customer exists.'
    }
  }

  if (billing === 'portal') {
    return {
      status: 'success',
      title: 'Returned from billing portal',
      description: 'Any billing portal changes will be reflected after Stripe sends the webhook update.'
    }
  }

  return null
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const redirectNotice = getBillingRedirectNotice(resolvedSearchParams)
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

      {redirectNotice ? (
        <Alert status={redirectNotice.status}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{redirectNotice.title}</Alert.Title>
            <Alert.Description>{redirectNotice.description}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

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
            contentClassName="flex justify-stretch p-5 sm:justify-end sm:p-8"
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
