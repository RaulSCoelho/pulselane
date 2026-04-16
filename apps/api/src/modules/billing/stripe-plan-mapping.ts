import { BillingPlan } from '@prisma/client'

import { billingPlanCatalog } from './billing-plan-catalog'

export const paidBillingPlans = [BillingPlan.starter, BillingPlan.growth] as const

export type PaidBillingPlan = (typeof paidBillingPlans)[number]

export function isPaidBillingPlan(plan: BillingPlan): plan is PaidBillingPlan {
  return billingPlanCatalog[plan].isFree === false
}
