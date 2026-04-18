import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { sortDirectionSchema, taskPrioritySchema, taskSortBySchema, taskStatusSchema } from '../shared/enums'
import {
  booleanQueryFalseDefaultSchema,
  idSchema,
  isoDatetimeSchema,
  nullableIsoDatetimeSchema
} from '../shared/primitives'
import { userSummarySchema } from '../shared/common'

export const createTaskRequestSchema = z.object({
  title: z.string().max(160),
  projectId: idSchema,
  description: z.string().max(2000).optional(),
  assigneeUserId: idSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  blockedReason: z.string().trim().min(1).max(500).optional(),
  dueDate: isoDatetimeSchema.optional()
})
export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>

export const updateTaskRequestSchema = createTaskRequestSchema.partial().extend({
  expectedUpdatedAt: isoDatetimeSchema
})
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>

export const listTasksQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().optional(),
  projectId: idSchema.optional(),
  assigneeUserId: idSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  overdue: booleanQueryFalseDefaultSchema,
  dueDateFrom: isoDatetimeSchema.optional(),
  dueDateTo: isoDatetimeSchema.optional(),
  sortBy: taskSortBySchema.default('created_at'),
  sortDirection: sortDirectionSchema.default('desc'),
  includeArchived: booleanQueryFalseDefaultSchema
})
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>

export const taskProjectSummarySchema = z.object({
  id: idSchema,
  name: z.string()
})
export type TaskProjectSummary = z.infer<typeof taskProjectSummarySchema>

export const taskAssigneeSchema = userSummarySchema
export type TaskAssignee = z.infer<typeof taskAssigneeSchema>

export const taskResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  projectId: idSchema,
  assigneeUserId: idSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  blockedReason: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: nullableIsoDatetimeSchema,
  archivedAt: nullableIsoDatetimeSchema,
  project: taskProjectSummarySchema,
  assignee: taskAssigneeSchema.nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
})
export type TaskResponse = z.infer<typeof taskResponseSchema>

export const listTasksResponseSchema = createCursorListResponseSchema(taskResponseSchema)
export type ListTasksResponse = z.infer<typeof listTasksResponseSchema>