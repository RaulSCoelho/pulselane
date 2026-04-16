/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { BillingPlan, BillingSubscriptionStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

export function registerBillingPlansCatalogFreeCase(): void {
  it('should return the explicit plan catalog with checkout actions for paid plans when organization is on free plan', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'billing-plans-free-owner@example.com',
      organizationName: 'Billing Plans Free Workspace'
    })

    await prisma.organizationBilling.upsert({
      where: {
        organizationId: owner.organizationId
      },
      create: {
        organizationId: owner.organizationId,
        plan: BillingPlan.free,
        status: BillingSubscriptionStatus.free
      },
      update: {
        plan: BillingPlan.free,
        status: BillingSubscriptionStatus.free,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      }
    })

    const response = await withOrgAuth(request(app.getHttpServer()).get('/api/billing/plans'), owner).expect(200)

    expect(response.body.current.plan).toBe(BillingPlan.free)
    expect(response.body.current.status).toBe(BillingSubscriptionStatus.free)
    expect(response.body.plans).toHaveLength(3)

    const freePlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.free)
    const starterPlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.starter)
    const growthPlan = response.body.plans.find((plan: { plan: BillingPlan }) => plan.plan === BillingPlan.growth)

    expect(freePlan).toMatchObject({
      plan: BillingPlan.free,
      isCurrent: true,
      action: 'current',
      changeKind: 'none',
      monthlyPriceCents: 0
    })

    expect(starterPlan).toMatchObject({
      plan: BillingPlan.starter,
      isCurrent: false,
      action: 'checkout',
      changeKind: 'upgrade',
      monthlyPriceCents: 2900
    })

    expect(growthPlan).toMatchObject({
      plan: BillingPlan.growth,
      isCurrent: false,
      action: 'checkout',
      changeKind: 'upgrade',
      monthlyPriceCents: 9900
    })
  })
}
