'use client'

import { createApiHttpError } from '@/http/api-error'
import { clientApi, type ClientApiOptions } from '@/http/client-api-client'
import type { z } from 'zod'

type QueryValue = string | number | boolean | null | undefined

export function buildClientQueryString(query: Record<string, QueryValue>) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return
    }

    params.set(key, String(value))
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export async function clientApiJson<TSchema extends z.ZodTypeAny>({
  path,
  schema,
  fallbackMessage,
  init
}: {
  path: string
  schema: TSchema
  fallbackMessage: string
  init?: ClientApiOptions
}): Promise<z.infer<TSchema>> {
  const response = await clientApi<z.infer<TSchema>>(path, init)

  if (!response.ok) {
    throw await createApiHttpError(response, fallbackMessage)
  }

  const body = await response.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw new Error('Unexpected API response.')
  }

  return parsed.data
}
