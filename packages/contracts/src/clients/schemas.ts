import { z } from 'zod'

import { createCursorListResponseSchema, cursorPaginationQuerySchema } from '../shared/pagination'
import { clientStatusSchema } from '../shared/enums'
import { idSchema, isoDatetimeSchema, nullableIsoDatetimeSchema, booleanQueryFalseDefaultSchema } from '../shared/primitives'

export const createClientRequestSchema = z.object({
  name: z.string().max(120),
  email: z.string().email().optional(),
  companyName: z.string().max(160).optional(),
  status: clientStatusSchema.optional()
})
export type CreateClientRequest = z.infer<typeof createClientRequestSchema>

export const updateClientRequestSchema = createClientRequestSchema.partial().extend({
  expectedUpdatedAt: isoDatetimeSchema
})
export type UpdateClientRequest = z.infer<typeof updateClientRequestSchema>

export const listClientsQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().optional(),
  status: clientStatusSchema.optional(),
  includeArchived: booleanQueryFalseDefaultSchema
})
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>

export const clientResponseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: z.string(),
  email: z.string().email().nullable(),
  companyName: z.string().nullable(),
  status: clientStatusSchema,
  archivedAt: nullableIsoDatetimeSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema
})
export type ClientResponse = z.infer<typeof clientResponseSchema>

export const listClientsResponseSchema = createCursorListResponseSchema(clientResponseSchema)
export type ListClientsResponse = z.infer<typeof listClientsResponseSchema>