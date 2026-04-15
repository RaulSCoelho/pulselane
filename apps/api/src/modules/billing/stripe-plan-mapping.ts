import { BillingPlan } from '@prisma/client'

export const paidBillingPlans = [BillingPlan.starter, BillingPlan.growth] as const

export type PaidBillingPlan = (typeof paidBillingPlans)[number]

export function isPaidBillingPlan(plan: BillingPlan): plan is PaidBillingPlan {
  return plan === BillingPlan.starter || plan === BillingPlan.growth
}
