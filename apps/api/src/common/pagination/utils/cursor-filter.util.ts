import type { CursorPayload } from '../types/cursor-payload.type'
import { decodeCursor } from './cursor.util'

export type CreatedAtIdCursorWhere = {
  OR: [{ createdAt: { lt: Date } }, { createdAt: Date; id: { lt: string } }]
}

export function buildCreatedAtIdCursorFilter(cursor?: string): {
  decodedCursor: CursorPayload | null
  where?: CreatedAtIdCursorWhere
} {
  const decodedCursor = decodeCursor(cursor)

  if (!decodedCursor) {
    return {
      decodedCursor: null,
      where: undefined
    }
  }

  const createdAt = new Date(decodedCursor.createdAt)

  return {
    decodedCursor,
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
            lt: decodedCursor.id
          }
        }
      ]
    }
  }
}
