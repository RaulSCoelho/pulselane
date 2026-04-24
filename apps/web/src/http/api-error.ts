import type { ErrorResponse } from '@pulselane/contracts'

import { parseRetryAfterMs } from './rate-limit'

export class ApiHttpError extends Error {
  readonly statusCode: number
  readonly statusText: string
  readonly retryAfterMs: number | null

  constructor(message: string, response: Response) {
    super(message)
    this.name = 'ApiHttpError'
    this.statusCode = response.status
    this.statusText = response.statusText
    this.retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
  }
}

export async function readApiErrorMessage(response: Response, fallbackMessage: string) {
  const body = (await response.json().catch(() => null)) as ErrorResponse | { message?: string } | null

  if (!body) {
    return fallbackMessage
  }

  if ('message' in body && Array.isArray(body.message)) {
    return body.message.join('\n')
  }

  if ('message' in body && typeof body.message === 'string') {
    return body.message
  }

  return fallbackMessage
}

export async function createApiHttpError(response: Response, fallbackMessage: string) {
  return new ApiHttpError(await readApiErrorMessage(response, fallbackMessage), response)
}

export function isRateLimitedApiError(error: unknown): boolean {
  return error instanceof ApiHttpError && error.statusCode === 429
}

export function isNetworkApiError(error: unknown): boolean {
  return error instanceof TypeError
}

export function isTransientQueryError(error: unknown): boolean {
  return isRateLimitedApiError(error) || isNetworkApiError(error)
}
