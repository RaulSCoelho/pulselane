import { BadRequestException } from '@nestjs/common'

import type { CreatedAtIdCursorPayload } from '../types/cursor-payload.type'
import { decodeCursor } from './cursor.util'

export type CreatedAtIdCursorWhere = {
  OR: [{ createdAt: { lt: Date } }, { createdAt: Date; id: { lt: string } }]
}

function isCreatedAtIdCursorPayload(value: Record<string, unknown>): value is CreatedAtIdCursorPayload {
  return typeof value.id === 'string' && typeof value.createdAt === 'string'
}

export function buildCreatedAtIdCursorFilter(cursor?: string): {
  decodedCursor: CreatedAtIdCursorPayload | null
  where?: CreatedAtIdCursorWhere
} {
  const decoded = decodeCursor(cursor)

  if (!decoded) {
    return {
      decodedCursor: null,
      where: undefined
    }
  }

  if (!isCreatedAtIdCursorPayload(decoded)) {
    throw new BadRequestException('Invalid cursor')
  }

  const createdAt = new Date(decoded.createdAt)

  if (Number.isNaN(createdAt.getTime())) {
    throw new BadRequestException('Invalid cursor')
  }

  return {
    decodedCursor: decoded,
    where: {
      OR: [
        {
          createdAt: {
            lt: createdAt
          }
        },
        {
          createdAt,
          id: {
            lt: decoded.id
          }
        }
      ]
    }
  }
}
