import { BillingPlan } from '@prisma/client'

export type UsageMetric = 'members' | 'clients' | 'projects' | 'active_tasks'
export type BillingInterval = 'month'

export enum BillingPlanActionType {
  current = 'current',
  checkout = 'checkout',
  manage_in_portal = 'manage_in_portal',
  unavailable = 'unavailable'
}

export enum BillingPlanChangeKind {
  none = 'none',
  upgrade = 'upgrade',
  downgrade = 'downgrade',
  lateral = 'lateral'
}

export type BillingPlanCatalogEntry = {
  plan: BillingPlan
  displayName: string
  description: string
  monthlyPriceCents: number
  currency: 'USD'
  billingInterval: BillingInterval
  isFree: boolean
  limits: Record<UsageMetric, number | null>
}

export const billingPlanOrder = [BillingPlan.free, BillingPlan.starter, BillingPlan.growth] as const

export const billingPlanCatalog: Record<BillingPlan, BillingPlanCatalogEntry> = {
  [BillingPlan.free]: {
    plan: BillingPlan.free,
    displayName: 'Free',
    description: 'Starter workspace for small teams validating the product.',
    monthlyPriceCents: 0,
    currency: 'USD',
    billingInterval: 'month',
    isFree: true,
    limits: {
      members: 3,
      clients: 10,
      projects: 10,
      active_tasks: 100
    }
  },
  [BillingPlan.starter]: {
    plan: BillingPlan.starter,
    displayName: 'Starter',
    description: 'Paid plan for growing teams that already need real operational capacity.',
    monthlyPriceCents: 2900,
    currency: 'USD',
    billingInterval: 'month',
    isFree: false,
    limits: {
      members: 10,
      clients: 100,
      projects: 100,
      active_tasks: 5000
    }
  },
  [BillingPlan.growth]: {
    plan: BillingPlan.growth,
    displayName: 'Growth',
    description: 'High-capacity plan for teams that need scale without operational caps.',
    monthlyPriceCents: 9900,
    currency: 'USD',
    billingInterval: 'month',
    isFree: false,
    limits: {
      members: null,
      clients: null,
      projects: null,
      active_tasks: null
    }
  }
}

export function getBillingPlanCatalogList(): BillingPlanCatalogEntry[] {
  return billingPlanOrder.map(plan => billingPlanCatalog[plan])
}

export function getBillingPlanRank(plan: BillingPlan): number {
  return billingPlanOrder.indexOf(plan)
}
