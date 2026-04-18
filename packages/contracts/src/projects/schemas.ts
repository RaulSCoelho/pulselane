import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { projectStatusSchema } from '../shared/enums'
import { booleanQueryFalseDefaultSchema, idSchema, isoDatetimeSchema, nullableIsoDatetimeSchema } from '../shared/primitives'

export const createProjectRequestSchema = z.object({
  name: z.string().max(120),
  clientId: idSchema,
  description: z.string().max(1000).optional(),
  status: projectStatusSchema.optional()
})
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>

export const updateProjectRequestSchema = createProjectRequestSchema.partial().extend({
  expectedUpdatedAt: isoDatetimeSchema
})
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>

export const listProjectsQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().optional(),
  clientId: idSchema.optional(),
  status: projectStatusSchema.optional(),
  includeArchived: booleanQueryFalseDefaultSchema
})
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>

export const projectClientSummarySchema = z.object({
  id: idSchema,
  name: z.string()
})
export type ProjectClientSummary = z.infer<typeof projectClientSummarySchema>

export const projectResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  clientId: idSchema,
  name: z.string(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  archivedAt: nullableIsoDatetimeSchema,
  client: projectClientSummarySchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
})
export type ProjectResponse = z.infer<typeof projectResponseSchema>

export const listProjectsResponseSchema = createCursorListResponseSchema(projectResponseSchema)
export type ListProjectsResponse = z.infer<typeof listProjectsResponseSchema>