import { BadRequestException } from '@nestjs/common'

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
}

export function decodeCursor<T extends Record<string, unknown> = Record<string, unknown>>(cursor?: string): T | null {
  if (!cursor) {
    return null
  }

  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as unknown

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid cursor shape')
    }

    return parsed as T
  } catch {
    throw new BadRequestException('Invalid cursor')
  }
}
