import { BillingPlan } from '@prisma/client'

import { billingPlanCatalog, type UsageMetric } from './billing-plan-catalog'

export type { UsageMetric } from './billing-plan-catalog'

export const billingPlanLimits: Record<BillingPlan, Record<UsageMetric, number | null>> = {
  [BillingPlan.free]: billingPlanCatalog[BillingPlan.free].limits,
  [BillingPlan.starter]: billingPlanCatalog[BillingPlan.starter].limits,
  [BillingPlan.growth]: billingPlanCatalog[BillingPlan.growth].limits
}

export const usageMetricLabels: Record<UsageMetric, string> = {
  members: 'members',
  clients: 'clients',
  projects: 'projects',
  active_tasks: 'active tasks'
}
