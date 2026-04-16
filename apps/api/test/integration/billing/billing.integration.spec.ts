import { describe } from 'vitest'

import { registerBillingWebhookIdempotentCase } from './billing-webhook-idempotent.case'
import { registerBillingPlansCatalogFreeCase } from './plans-catalog-free.case'
import { registerBillingPlansCatalogPortalActionsCase } from './plans-catalog-portal-actions.case'

describe('Billing integration', () => {
  registerBillingWebhookIdempotentCase()
  registerBillingPlansCatalogFreeCase()
  registerBillingPlansCatalogPortalActionsCase()
})
