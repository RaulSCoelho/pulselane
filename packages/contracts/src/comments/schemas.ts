import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { commentActivitySourceSchema } from '../shared/enums'
import { jsonValueSchema, idSchema, isoDatetimeSchema, nullableIsoDatetimeSchema } from '../shared/primitives'
import { userSummarySchema } from '../shared/common'

export const createCommentRequestSchema = z.object({
  taskId: idSchema,
  body: z.string().trim().min(1).max(4000)
})
export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>

export const updateCommentRequestSchema = z.object({
  body: z.string().trim().min(1).max(4000)
})
export type UpdateCommentRequest = z.infer<typeof updateCommentRequestSchema>

export const listCommentsQuerySchema = cursorPaginationQuerySchema.extend({
  taskId: idSchema
})
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>

export const listCommentActivityHistoryQuerySchema = cursorPaginationQuerySchema.extend({
  taskId: idSchema
})
export type ListCommentActivityHistoryQuery = z.infer<typeof listCommentActivityHistoryQuerySchema>

export const commentResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  taskId: idSchema,
  authorUserId: idSchema,
  body: z.string(),
  deletedAt: nullableIsoDatetimeSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
  author: userSummarySchema
})
export type CommentResponse = z.infer<typeof commentResponseSchema>

export const listCommentsResponseSchema = createCursorListResponseSchema(commentResponseSchema)
export type ListCommentsResponse = z.infer<typeof listCommentsResponseSchema>

export const commentActivityHistoryItemSchema = z.object({
  id: idSchema,
  source: commentActivitySourceSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: idSchema,
  taskId: idSchema,
  content: z.string().nullable(),
  occurredAt: isoDatetimeSchema,
  deletedAt: nullableIsoDatetimeSchema,
  metadata: jsonValueSchema.nullable(),
  actor: userSummarySchema.nullable()
})
export type CommentActivityHistoryItem = z.infer<typeof commentActivityHistoryItemSchema>

export const listCommentActivityHistoryResponseSchema = createCursorListResponseSchema(commentActivityHistoryItemSchema)
export type ListCommentActivityHistoryResponse = z.infer<typeof listCommentActivityHistoryResponseSchema>