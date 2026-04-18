import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { membershipRoleSchema } from '../shared/enums'
import { organizationSummarySchema, userSummarySchema } from '../shared/common'
import { idSchema, isoDatetimeSchema } from '../shared/primitives'

export const membershipResponseSchema = z.object({
  id: idSchema,
  userId: idSchema,
  organizationId: idSchema,
  role: membershipRoleSchema,
  createdAt: isoDatetimeSchema,
  user: userSummarySchema,
  organization: organizationSummarySchema
})
export type MembershipResponse = z.infer<typeof membershipResponseSchema>

export const listMembershipsQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().optional(),
  role: membershipRoleSchema.optional()
})
export type ListMembershipsQuery = z.infer<typeof listMembershipsQuerySchema>

export const listMembershipsResponseSchema = createCursorListResponseSchema(membershipResponseSchema)
export type ListMembershipsResponse = z.infer<typeof listMembershipsResponseSchema>

export const updateMembershipRoleRequestSchema = z.object({
  role: membershipRoleSchema
})
export type UpdateMembershipRoleRequest = z.infer<typeof updateMembershipRoleRequestSchema>