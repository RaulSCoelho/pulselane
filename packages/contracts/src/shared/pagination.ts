import { z } from 'zod'

import { cursorSchema, limitSchema } from './primitives'

export const cursorPaginationQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  limit: limitSchema
})
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>

export const cursorPageMetaSchema = z.object({
  limit: z.number().int().min(1),
  hasNextPage: z.boolean(),
  nextCursor: z.string().nullable()
})
export type CursorPageMeta = z.infer<typeof cursorPageMetaSchema>

export function createCursorListResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    meta: cursorPageMetaSchema
  })
}