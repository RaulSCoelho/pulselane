import { z } from 'zod'

import { membershipRoleSchema } from '../shared/enums'
import { organizationSummarySchema, userResponseSchema } from '../shared/common'
import { emailSchema, idSchema, isoDatetimeSchema, nonEmptyStringSchema, nullableIsoDatetimeSchema } from '../shared/primitives'

export const signupRequestSchema = z.object({
  name: nonEmptyStringSchema,
  email: emailSchema,
  password: z.string().min(6),
  organizationName: nonEmptyStringSchema
})
export type SignupRequest = z.infer<typeof signupRequestSchema>

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(6)
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const authResponseSchema = z.object({
  accessToken: nonEmptyStringSchema,
  expiresIn: z.number().int().nonnegative()
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export const meMembershipSchema = z.object({
  id: idSchema,
  role: membershipRoleSchema,
  organization: organizationSummarySchema
})
export type MeMembership = z.infer<typeof meMembershipSchema>

export const meResponseSchema = userResponseSchema.extend({
  memberships: z.array(meMembershipSchema)
})
export type MeResponse = z.infer<typeof meResponseSchema>

export const sessionResponseSchema = z.object({
  id: idSchema,
  deviceId: nonEmptyStringSchema,
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: isoDatetimeSchema,
  lastUsedAt: nullableIsoDatetimeSchema,
  expiresAt: isoDatetimeSchema,
  revokedAt: nullableIsoDatetimeSchema,
  compromisedAt: nullableIsoDatetimeSchema,
  isCurrent: z.boolean(),
  isActive: z.boolean()
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>

export const sessionListResponseSchema = z.array(sessionResponseSchema)
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>