import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { auditLogActionSchema } from '../shared/enums'
import { jsonValueSchema, idSchema, isoDatetimeSchema } from '../shared/primitives'
import { userSummarySchema } from '../shared/common'

export const listAuditLogsQuerySchema = cursorPaginationQuerySchema.extend({
  entityType: z.string().optional(),
  entityId: idSchema.optional(),
  actorUserId: idSchema.optional(),
  action: auditLogActionSchema.optional()
})
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>

export const auditLogResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  actorUserId: idSchema,
  entityType: z.string(),
  entityId: idSchema,
  action: auditLogActionSchema,
  metadata: jsonValueSchema.nullable(),
  actorUser: userSummarySchema,
  createdAt: isoDatetimeSchema
})
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>

export const listAuditLogsResponseSchema = createCursorListResponseSchema(auditLogResponseSchema)
export type ListAuditLogsResponse = z.infer<typeof listAuditLogsResponseSchema>