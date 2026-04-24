import type { ErrorResponse } from '@pulselane/contracts'

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
