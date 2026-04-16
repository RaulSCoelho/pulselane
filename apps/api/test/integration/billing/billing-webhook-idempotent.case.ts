import { StripeBillingService } from '@/modules/billing/stripe-billing.service'
import { BillingPlan, BillingSubscriptionStatus } from '@prisma/client'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { getTestContext } from '../../support/runtime/test-context'

export function registerBillingWebhookIdempotentCase(): void {
  it('should process the same webhook event only once', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'billing-webhook-idempotent-owner@example.com',
      organizationName: 'Billing Webhook Idempotent Workspace'
    })

    await prisma.organizationBilling.upsert({
      where: {
        organizationId: owner.organizationId
      },
      create: {
        organizationId: owner.organizationId
      },
      update: {}
    })

    const stripeBillingService = app.get(StripeBillingService)

    Object.defineProperty(stripeBillingService, 'stripeEnabled', {
      value: true,
      configurable: true
    })

    Object.defineProperty(stripeBillingService, 'stripe', {
      value: {},
      configurable: true
    })

    Object.defineProperty(stripeBillingService, 'priceByPlan', {
      value: {
        [BillingPlan.starter]: 'price_starter_test',
        [BillingPlan.growth]: 'price_growth_test'
      },
      configurable: true
    })

    const event = {
      id: 'evt_billing_webhook_idempotent_test',
      type: 'customer.subscription.updated',
      created: 1_700_000_000,
      data: {
        object: {
          id: 'sub_billing_webhook_idempotent_test',
          customer: 'cus_billing_webhook_idempotent_test',
          metadata: {
            organizationId: owner.organizationId,
            plan: BillingPlan.starter
          },
          items: {
            data: [
              {
                price: {
                  id: 'price_starter_test'
                }
              }
            ]
          },
          status: 'active',
          cancel_at_period_end: false,
          current_period_end: 1_700_003_600
        }
      }
    }

    await stripeBillingService.processWebhook(event as never)
    await stripeBillingService.processWebhook(event as never)

    const webhookEvents = await prisma.billingWebhookEvent.findMany({
      where: {
        providerEventId: 'evt_billing_webhook_idempotent_test'
      }
    })

    expect(webhookEvents).toHaveLength(1)
    expect(webhookEvents[0].processedAt).not.toBeNull()

    const billing = await prisma.organizationBilling.findUniqueOrThrow({
      where: {
        organizationId: owner.organizationId
      }
    })

    expect(billing.plan).toBe(BillingPlan.starter)
    expect(billing.status).toBe(BillingSubscriptionStatus.active)
    expect(billing.stripeCustomerId).toBe('cus_billing_webhook_idempotent_test')
    expect(billing.stripeSubscriptionId).toBe('sub_billing_webhook_idempotent_test')

    const billingAuditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId: owner.organizationId,
        entityType: 'organization_billing'
      }
    })

    expect(billingAuditLogs).toHaveLength(1)
  })
}
