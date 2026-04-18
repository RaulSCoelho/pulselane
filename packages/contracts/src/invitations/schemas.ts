import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { membershipRoleSchema, organizationInvitationStatusSchema } from '../shared/enums'
import { organizationSummarySchema, userSummarySchema } from '../shared/common'
import { emailSchema, idSchema, isoDatetimeSchema, nonEmptyStringSchema } from '../shared/primitives'

export const createInvitationRequestSchema = z.object({
  email: emailSchema,
  role: membershipRoleSchema
})
export type CreateInvitationRequest = z.infer<typeof createInvitationRequestSchema>

export const acceptInvitationRequestSchema = z.object({
  token: nonEmptyStringSchema
})
export type AcceptInvitationRequest = z.infer<typeof acceptInvitationRequestSchema>

export const previewInvitationQuerySchema = z.object({
  token: nonEmptyStringSchema
})
export type PreviewInvitationQuery = z.infer<typeof previewInvitationQuerySchema>

export const listInvitationsQuerySchema = cursorPaginationQuerySchema.extend({
  email: emailSchema.optional(),
  status: organizationInvitationStatusSchema.optional()
})
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>

export const invitationResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  invitedByUserId: idSchema,
  email: emailSchema,
  token: nonEmptyStringSchema,
  role: membershipRoleSchema,
  status: organizationInvitationStatusSchema,
  expiresAt: isoDatetimeSchema,
  acceptedAt: isoDatetimeSchema.nullable(),
  revokedAt: isoDatetimeSchema.nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
  invitedBy: userSummarySchema,
  organization: organizationSummarySchema
})
export type InvitationResponse = z.infer<typeof invitationResponseSchema>

export const listInvitationsResponseSchema = createCursorListResponseSchema(invitationResponseSchema)
export type ListInvitationsResponse = z.infer<typeof listInvitationsResponseSchema>

export const previewInvitationResponseSchema = z.object({
  id: idSchema,
  email: emailSchema,
  role: membershipRoleSchema,
  status: organizationInvitationStatusSchema,
  organizationName: z.string(),
  organizationSlug: z.string(),
  invitedByName: z.string(),
  expiresAt: isoDatetimeSchema,
  isExpired: z.boolean(),
  canAccept: z.boolean()
})
export type PreviewInvitationResponse = z.infer<typeof previewInvitationResponseSchema>