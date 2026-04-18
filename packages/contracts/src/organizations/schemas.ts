import { z } from 'zod'

import { billingPlanSchema, billingSubscriptionStatusSchema, membershipRoleSchema } from '../shared/enums'
import { organizationResponseSchema } from '../shared/common'
import { isoDatetimeSchema, nullableIsoDatetimeSchema, slugSchema } from '../shared/primitives'

export const listOrganizationsResponseSchema = z.object({
  items: z.array(organizationResponseSchema)
})
export type ListOrganizationsResponse = z.infer<typeof listOrganizationsResponseSchema>

export const organizationPlanSchema = z.object({
  plan: billingPlanSchema,
  status: billingSubscriptionStatusSchema,
  currentPeriodEnd: nullableIsoDatetimeSchema,
  cancelAtPeriodEnd: z.boolean()
})
export type OrganizationPlan = z.infer<typeof organizationPlanSchema>

export const organizationLimitsSchema = z.object({
  members: z.number().int().nullable(),
  clients: z.number().int().nullable(),
  projects: z.number().int().nullable(),
  activeTasks: z.number().int().nullable()
})
export type OrganizationLimits = z.infer<typeof organizationLimitsSchema>

export const organizationUsageSchema = z.object({
  members: z.number().int(),
  clients: z.number().int(),
  projects: z.number().int(),
  activeTasks: z.number().int()
})
export type OrganizationUsage = z.infer<typeof organizationUsageSchema>

export const currentOrganizationResponseSchema = z.object({
  organization: organizationResponseSchema,
  currentRole: membershipRoleSchema,
  plan: organizationPlanSchema,
  limits: organizationLimitsSchema,
  usage: organizationUsageSchema
})
export type CurrentOrganizationResponse = z.infer<typeof currentOrganizationResponseSchema>

export const updateOrganizationRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional()
})
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>