import { z } from 'zod'

import {
  billingPlanActionTypeSchema,
  billingPlanChangeKindSchema,
  billingPlanSchema,
  billingSubscriptionStatusSchema
} from '../shared/enums'
import { isoDatetimeSchema, nullableIsoDatetimeSchema, urlSchema } from '../shared/primitives'

export const createCheckoutSessionRequestSchema = z.object({
  plan: billingPlanSchema
})
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionRequestSchema>

export const billingPlanLimitsSchema = z.object({
  members: z.number().int().nullable(),
  clients: z.number().int().nullable(),
  projects: z.number().int().nullable(),
  active_tasks: z.number().int().nullable()
})
export type BillingPlanLimits = z.infer<typeof billingPlanLimitsSchema>

export const billingPlanCatalogItemSchema = z.object({
  plan: billingPlanSchema,
  displayName: z.string(),
  description: z.string(),
  monthlyPriceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  billingInterval: z.string(),
  isFree: z.boolean(),
  isCurrent: z.boolean(),
  action: billingPlanActionTypeSchema,
  changeKind: billingPlanChangeKindSchema,
  limits: billingPlanLimitsSchema
})
export type BillingPlanCatalogItem = z.infer<typeof billingPlanCatalogItemSchema>

export const currentOrganizationBillingSchema = z.object({
  plan: billingPlanSchema,
  status: billingSubscriptionStatusSchema,
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: nullableIsoDatetimeSchema,
  stripeCustomerConfigured: z.boolean(),
  stripeSubscriptionConfigured: z.boolean()
})
export type CurrentOrganizationBilling = z.infer<typeof currentOrganizationBillingSchema>

export const billingPlansResponseSchema = z.object({
  current: currentOrganizationBillingSchema,
  plans: z.array(billingPlanCatalogItemSchema)
})
export type BillingPlansResponse = z.infer<typeof billingPlansResponseSchema>

export const createCheckoutSessionResponseSchema = z.object({
  sessionId: z.string(),
  url: urlSchema
})
export type CreateCheckoutSessionResponse = z.infer<typeof createCheckoutSessionResponseSchema>

export const createBillingPortalSessionResponseSchema = z.object({
  url: urlSchema
})
export type CreateBillingPortalSessionResponse = z.infer<typeof createBillingPortalSessionResponseSchema>