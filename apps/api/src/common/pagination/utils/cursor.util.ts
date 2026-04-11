import { BadRequestException } from '@nestjs/common'

import type { CursorPayload } from '../types/cursor-payload.type'

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
}

export function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) {
    return null
  }

  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as CursorPayload

    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') {
      throw new Error('Invalid cursor shape')
    }

    const date = new Date(parsed.createdAt)

    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid cursor date')
    }

    return parsed
  } catch {
    throw new BadRequestException('Invalid cursor')
  }
}
