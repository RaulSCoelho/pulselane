export type SortDirectionValue = 'asc' | 'desc'

export type SortableDateFieldIdCursorPayload<TSortBy extends string> = {
  id: string
  sortBy: TSortBy
  sortDirection: SortDirectionValue
  value: string | null
}
