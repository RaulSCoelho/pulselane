import { describe } from 'vitest'

import { registerBillingWebhookIdempotentCase } from './billing-webhook-idempotent.case'

describe('Billing integration', () => {
  registerBillingWebhookIdempotentCase()
})
