import { BadRequestException } from '@nestjs/common'

import type {
  SortableDateFieldIdCursorPayload,
  SortDirectionValue
} from '../types/sortable-date-field-id-cursor-payload.type'
import { decodeCursor } from './cursor.util'

export type SortableDateFieldConfig = {
  field: string
  nullable?: boolean
}

export type SortableDateFieldConfigMap<TSortBy extends string> = Record<TSortBy, SortableDateFieldConfig>

function isSortDirectionValue(value: unknown): value is SortDirectionValue {
  return value === 'asc' || value === 'desc'
}

export function buildSortableDateFieldIdOrderBy<TSortBy extends string>(
  sortBy: TSortBy,
  sortDirection: SortDirectionValue,
  configMap: SortableDateFieldConfigMap<TSortBy>
) {
  const config = configMap[sortBy]

  if (config.nullable) {
    return [
      {
        [config.field]: {
          sort: sortDirection,
          nulls: 'last'
        }
      },
      {
        id: sortDirection
      }
    ]
  }

  return [
    {
      [config.field]: sortDirection
    },
    {
      id: sortDirection
    }
  ]
}

export function buildSortableDateFieldIdCursorPayload<TSortBy extends string>(
  item: Record<string, unknown>,
  sortBy: TSortBy,
  sortDirection: SortDirectionValue,
  configMap: SortableDateFieldConfigMap<TSortBy>
): SortableDateFieldIdCursorPayload<TSortBy> {
  const config = configMap[sortBy]
  const id = item.id
  const rawValue = item[config.field]

  if (typeof id !== 'string') {
    throw new Error('Cursor payload item must contain a string id')
  }

  if (rawValue !== null && !(rawValue instanceof Date)) {
    throw new Error(`Cursor payload item field "${config.field}" must be a Date or null`)
  }

  return {
    id,
    sortBy,
    sortDirection,
    value: rawValue instanceof Date ? rawValue.toISOString() : null
  }
}

export function buildSortableDateFieldIdCursorWhere<TSortBy extends string>(
  cursor: string | undefined,
  sortBy: TSortBy,
  sortDirection: SortDirectionValue,
  configMap: SortableDateFieldConfigMap<TSortBy>
) {
  const decoded = decodeSortableDateFieldIdCursor(cursor, Object.keys(configMap) as TSortBy[])

  if (!decoded) {
    return undefined
  }

  if (decoded.sortBy !== sortBy || decoded.sortDirection !== sortDirection) {
    throw new BadRequestException('Invalid cursor')
  }

  const config = configMap[sortBy]
  const field = config.field
  const idComparator = sortDirection === 'asc' ? 'gt' : 'lt'

  if (decoded.value === null) {
    if (!config.nullable) {
      throw new BadRequestException('Invalid cursor')
    }

    return {
      [field]: null,
      id: {
        [idComparator]: decoded.id
      }
    }
  }

  const dateValue = new Date(decoded.value)

  if (Number.isNaN(dateValue.getTime())) {
    throw new BadRequestException('Invalid cursor')
  }

  const dateComparator = sortDirection === 'asc' ? 'gt' : 'lt'

  const orConditions: Array<Record<string, unknown>> = [
    {
      [field]: {
        [dateComparator]: dateValue
      }
    },
    {
      [field]: dateValue,
      id: {
        [idComparator]: decoded.id
      }
    }
  ]

  if (config.nullable) {
    orConditions.push({
      [field]: null
    })
  }

  return {
    OR: orConditions
  }
}

export function decodeSortableDateFieldIdCursor<TSortBy extends string>(
  cursor: string | undefined,
  allowedSortByValues: readonly TSortBy[]
): SortableDateFieldIdCursorPayload<TSortBy> | null {
  const decoded = decodeCursor<SortableDateFieldIdCursorPayload<TSortBy>>(cursor)

  if (!decoded) {
    return null
  }

  const { id, sortBy, sortDirection, value } = decoded

  const isAllowedSortBy = typeof sortBy === 'string' && allowedSortByValues.includes(sortBy)
  const isAllowedValue = typeof value === 'string' || value === null

  if (typeof id !== 'string' || !isAllowedSortBy || !isSortDirectionValue(sortDirection) || !isAllowedValue) {
    throw new BadRequestException('Invalid cursor')
  }

  return {
    id,
    sortBy,
    sortDirection,
    value
  }
}
