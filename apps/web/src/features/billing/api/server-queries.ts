import { billingPlansCacheTag } from '@/features/billing/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { BillingPlansResponse, billingPlansResponseSchema } from '@pulselane/contracts/billing'
import { cache } from 'react'

import { billingPlansResultToState, type BillingPlansState } from './billing-plans-state'

export type { BillingPlansState, BillingPlansUnavailableReason } from './billing-plans-state'

async function getBillingPlansCacheTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return [billingPlansCacheTag(organizationId)]
}

export const getBillingPlans = cache(async function getBillingPlans(): Promise<BillingPlansState> {
  const result = await cachedServerApiGet<BillingPlansResponse>({
    path: '/api/v1/billing/plans',
    schema: billingPlansResponseSchema,
    tags: await getBillingPlansCacheTags(),
    revalidate: 120
  })

  return billingPlansResultToState(result)
})
