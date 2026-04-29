import { billingPlansCacheTag } from '@/features/billing/api/cache-tags'
import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { BillingPlansResponse, billingPlansResponseSchema } from '@pulselane/contracts/billing'
import { cache } from 'react'

import { billingPlansResultToState, type BillingPlansState } from './billing-plans-state'

export type { BillingPlansState, BillingPlansUnavailableReason } from './billing-plans-state'

async function getBillingPlansSnapshotTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [billingPlansCacheTag(organizationId)]
}

export const getBillingPlans = cache(async function getBillingPlans(): Promise<BillingPlansState> {
  const result = await resilientGet<BillingPlansResponse>({
    key: 'billing.plans',
    path: '/api/v1/billing/plans',
    schema: billingPlansResponseSchema,
    fallback: 'last-valid',
    tags: await getBillingPlansSnapshotTags(),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return billingPlansResultToState(result)
  }

  return billingPlansResultToState(result)
})
