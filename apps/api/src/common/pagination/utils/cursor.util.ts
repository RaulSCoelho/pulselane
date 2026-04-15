import { BadRequestException } from '@nestjs/common'

export function encodeCursor(payload: Record<string, any>): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
}

export function decodeCursor(cursor?: string): Record<string, any> | null {
  if (!cursor) {
    return null
  }

  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as Record<string, any>

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
