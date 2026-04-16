/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { BillingPlan, BillingSubscriptionStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

export function registerBillingPlansCatalogPortalActionsCase(): void {
  it('should return portal actions for upgrade and downgrade when organization already has stripe-managed billing', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'billing-plans-portal-owner@example.com',
      organizationName: 'Billing Plans Portal Workspace'
    })

    await prisma.organizationBilling.upsert({
      where: {
        organizationId: owner.organizationId
      },
      create: {
        organizationId: owner.organizationId,
        plan: BillingPlan.starter,
        status: BillingSubscriptionStatus.active,
        stripeCustomerId: 'cus_billing_plans_portal',
        stripeSubscriptionId: 'sub_billing_plans_portal',
        currentPeriodEnd: new Date('2026-05-15T00:00:00.000Z'),
        cancelAtPeriodEnd: false
      },
      update: {
        plan: BillingPlan.starter,
        status: BillingSubscriptionStatus.active,
        stripeCustomerId: 'cus_billing_plans_portal',
        stripeSubscriptionId: 'sub_billing_plans_portal',
        currentPeriodEnd: new Date('2026-05-15T00:00:00.000Z'),
        cancelAtPeriodEnd: false
      }
    })

    const response = await withOrgAuth(request(app.getHttpServer()).get('/api/billing/plans'), owner).expect(200)

    expect(response.body.current.plan).toBe(BillingPlan.starter)
    expect(response.body.current.status).toBe(BillingSubscriptionStatus.active)
    expect(response.body.current.stripeCustomerConfigured).toBe(true)
    expect(response.body.current.stripeSubscriptionConfigured).toBe(true)

    const freePlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.free)
    const starterPlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.starter)
    const growthPlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.growth)

    expect(starterPlan).toMatchObject({
      plan: BillingPlan.starter,
      isCurrent: true,
      action: 'current',
      changeKind: 'none'
    })

    expect(freePlan).toMatchObject({
      plan: BillingPlan.free,
      isCurrent: false,
      action: 'manage_in_portal',
      changeKind: 'downgrade'
    })

    expect(growthPlan).toMatchObject({
      plan: BillingPlan.growth,
      isCurrent: false,
      action: 'manage_in_portal',
      changeKind: 'upgrade'
    })
  })
}
