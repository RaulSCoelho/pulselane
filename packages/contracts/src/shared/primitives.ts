import { z } from 'zod'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function normalizeBooleanInput(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
  }

  return value
}

export const nonEmptyStringSchema = z.string().trim().min(1)
export const idSchema = nonEmptyStringSchema
export const emailSchema = z.string().email()
export const urlSchema = z.string().url()
export const slugSchema = z
  .string()
  .trim()
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens'
  })

export const isoDatetimeSchema = z.string().datetime({ offset: true })
export const nullableIsoDatetimeSchema = isoDatetimeSchema.nullable()

export const cursorSchema = nonEmptyStringSchema
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20)

export const booleanQuerySchema = z.preprocess(normalizeBooleanInput, z.boolean())
export const booleanQueryFalseDefaultSchema = z.preprocess(
  value => (value === undefined ? false : normalizeBooleanInput(value)),
  z.boolean()
)

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema) as z.ZodType<JsonValue>,
  ])
) as z.ZodType<JsonValue>