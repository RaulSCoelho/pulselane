import { z } from 'zod'

import { idSchema, emailSchema, isoDatetimeSchema, jsonValueSchema, nullableIsoDatetimeSchema, nonEmptyStringSchema, slugSchema } from './primitives'

export const ORGANIZATION_HEADER_NAME = 'x-organization-id' as const

export const successResponseSchema = z.object({
  success: z.boolean()
})
export type SuccessResponse = z.infer<typeof successResponseSchema>

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: nonEmptyStringSchema,
  message: z.union([nonEmptyStringSchema, z.array(nonEmptyStringSchema)]),
  path: nonEmptyStringSchema,
  timestamp: isoDatetimeSchema
})
export type ErrorResponse = z.infer<typeof errorResponseSchema>

export const userSummarySchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  email: emailSchema
})
export type UserSummary = z.infer<typeof userSummarySchema>

export const userResponseSchema = userSummarySchema.extend({
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
})
export type UserResponse = z.infer<typeof userResponseSchema>

export const organizationSummarySchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  slug: slugSchema
})
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>

export const organizationResponseSchema = organizationSummarySchema.extend({
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
})
export type OrganizationResponse = z.infer<typeof organizationResponseSchema>

export const actorSummarySchema = userSummarySchema
export type ActorSummary = z.infer<typeof actorSummarySchema>

export const nullableJsonValueSchema = jsonValueSchema.nullable()
export type NullableJsonValue = z.infer<typeof nullableJsonValueSchema>

export const dateRangeSchema = z.object({
  from: nullableIsoDatetimeSchema.optional(),
  to: nullableIsoDatetimeSchema.optional()
})
export type DateRange = z.infer<typeof dateRangeSchema>