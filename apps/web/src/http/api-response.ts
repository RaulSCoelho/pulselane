import type { ZodType } from 'zod'

export async function parseApiResponse<T>(response: Response, schema: ZodType<T>): Promise<T> {
  return schema.parse(await response.json())
}
