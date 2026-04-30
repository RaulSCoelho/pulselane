'use client'

import { cn } from '@/lib/styles'
import { Button, Card, Checkbox, Input, Label, ListBox, Select, Skeleton, Table, TextField } from '@heroui/react'
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

export type DataTableFilterOption = {
  id: string
  label: string
}

type BaseDataTableFilter = {
  id: string
  label: string
  queryParam?: string
  className?: string
}

export type DataTableFilter =
  | (BaseDataTableFilter & {
      type: 'search'
      defaultValue?: string
      placeholder?: string
    })
  | (BaseDataTableFilter & {
      type: 'select'
      defaultValue?: string
      options: ReadonlyArray<DataTableFilterOption>
      placeholder?: string
    })
  | (BaseDataTableFilter & {
      type: 'checkbox'
      defaultValue?: boolean
    })

export type DataTableFilterValue = string | boolean
export type DataTableFilterValues = Record<string, DataTableFilterValue>

export type DataTablePage<TItem extends object> = {
  items: TItem[]
  meta: {
    limit: number
    hasNextPage: boolean
    nextCursor: string | null
  }
}

export type DataTableColumn<TItem extends object> = {
  id: string
  header: ReactNode
  render: (item: TItem) => ReactNode
  isRowHeader?: boolean
  className?: string
  cellClassName?: string
}

type RemoteDataTableProps<TItem extends object> = {
  title: ReactNode
  description?: ReactNode
  ariaLabel: string
  queryKey: QueryKey
  columns: Array<DataTableColumn<TItem>>
  filters?: DataTableFilter[]
  defaultLimit?: number
  minTableWidthClassName?: string
  emptyState: ReactNode
  getRowId: (item: TItem) => string
  fetchPage: (input: {
    cursor?: string
    limit: number
    filters: DataTableFilterValues
  }) => Promise<DataTablePage<TItem>>
  renderRowActions?: (item: TItem) => ReactNode
  rowActionsHeader?: ReactNode
  rowClassName?: (item: TItem) => string | undefined
}

const limitOptions: DataTableFilterOption[] = [
  { id: '20', label: '20 rows' },
  { id: '50', label: '50 rows' },
  { id: '100', label: '100 rows' }
]

function getFilterQueryParam(filter: DataTableFilter) {
  return filter.queryParam ?? filter.id
}

function readLimit(searchParams: URLSearchParams, defaultLimit: number) {
  const rawLimit = Number(searchParams.get('limit') ?? defaultLimit)

  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
    return defaultLimit
  }

  return rawLimit
}

function readFilterValues(filters: DataTableFilter[], searchParams: URLSearchParams) {
  return filters.reduce<DataTableFilterValues>((values, filter) => {
    const rawValue = searchParams.get(getFilterQueryParam(filter))

    if (filter.type === 'checkbox') {
      values[filter.id] = rawValue === null ? Boolean(filter.defaultValue) : rawValue === 'true' || rawValue === '1'
      return values
    }

    values[filter.id] = rawValue ?? filter.defaultValue ?? ''
    return values
  }, {})
}

function writeFiltersToSearchParams(
  params: URLSearchParams,
  filters: DataTableFilter[],
  values: DataTableFilterValues
) {
  filters.forEach(filter => {
    const queryParam = getFilterQueryParam(filter)
    const value = values[filter.id]

    params.delete(queryParam)

    if (filter.type === 'checkbox') {
      if (value === true) {
        params.set(queryParam, 'true')
      }

      return
    }

    const normalized = String(value ?? '').trim()
    const defaultValue = filter.defaultValue ?? ''

    if (normalized && normalized !== defaultValue) {
      params.set(queryParam, normalized)
    }
  })
}

function DataTableLoadingState({ columnsCount }: { columnsCount: number }) {
  return (
    <div className="skeleton--shimmer space-y-3 px-4 py-8">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}>
          {Array.from({ length: columnsCount }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              animationType="none"
              className={cn('h-4 rounded-full', columnIndex === 0 ? 'min-w-32' : '')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function DataTableMessage({
  title,
  description,
  action
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export function RemoteDataTable<TItem extends object>({
  title,
  description,
  ariaLabel,
  queryKey,
  columns,
  filters = [],
  defaultLimit = 20,
  minTableWidthClassName = 'min-w-190',
  emptyState,
  getRowId,
  fetchPage,
  renderRowActions,
  rowActionsHeader = 'Actions',
  rowClassName
}: RemoteDataTableProps<TItem>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const activeFilters = useMemo(
    () => readFilterValues(filters, new URLSearchParams(searchParamsKey)),
    [filters, searchParamsKey]
  )
  const activeLimit = useMemo(
    () => readLimit(new URLSearchParams(searchParamsKey), defaultLimit),
    [defaultLimit, searchParamsKey]
  )
  const [draftFilters, setDraftFilters] = useState<DataTableFilterValues>(activeFilters)
  const [draftLimit, setDraftLimit] = useState(String(activeLimit))
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const tableQuery = useInfiniteQuery({
    queryKey: [...queryKey, activeFilters, activeLimit],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchPage({
        cursor: typeof pageParam === 'string' ? pageParam : undefined,
        limit: activeLimit,
        filters: activeFilters
      }),
    getNextPageParam: page => (page.meta.hasNextPage ? (page.meta.nextCursor ?? undefined) : undefined)
  })

  const rows = tableQuery.data?.pages.flatMap(page => page.items) ?? []
  const columnsCount = columns.length + (renderRowActions ? 1 : 0)
  const isInitialLoading = tableQuery.isLoading && rows.length === 0

  useEffect(() => {
    const node = loadMoreRef.current

    if (!node || !tableQuery.hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0]

        if (firstEntry?.isIntersecting && !tableQuery.isFetchingNextPage) {
          void tableQuery.fetchNextPage()
        }
      },
      {
        rootMargin: '320px'
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [tableQuery])

  function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams(searchParamsKey)
    writeFiltersToSearchParams(params, filters, draftFilters)

    const normalizedLimit = readLimit(new URLSearchParams(`limit=${draftLimit}`), defaultLimit)
    params.delete('cursor')

    if (normalizedLimit === defaultLimit) {
      params.delete('limit')
    } else {
      params.set('limit', String(normalizedLimit))
    }

    const serialized = params.toString()
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false })
  }

  function handleResetFilters() {
    const params = new URLSearchParams(searchParamsKey)
    filters.forEach(filter => params.delete(getFilterQueryParam(filter)))
    params.delete('cursor')
    params.delete('limit')
    setDraftFilters(readFilterValues(filters, new URLSearchParams()))
    setDraftLimit(String(defaultLimit))

    const serialized = params.toString()
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false })
  }

  function renderEmptyState() {
    if (isInitialLoading) {
      return <DataTableLoadingState columnsCount={columnsCount} />
    }

    if (tableQuery.isError) {
      return (
        <DataTableMessage
          title="Unable to load this table."
          description={tableQuery.error instanceof Error ? tableQuery.error.message : 'Try again in a moment.'}
          action={
            <Button size="sm" variant="secondary" onPress={() => void tableQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )
    }

    return <DataTableMessage title={emptyState} />
  }

  return (
    <Card className="overflow-hidden border border-border shadow-surface">
      <Card.Header className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Card.Title className="text-xl font-semibold tracking-normal">{title}</Card.Title>
          {description ? <Card.Description className="mt-1 text-sm text-muted">{description}</Card.Description> : null}
        </div>
        <div className="text-sm text-muted">
          {tableQuery.isFetching && !tableQuery.isFetchingNextPage ? 'Refreshing' : `${rows.length} loaded`}
        </div>
      </Card.Header>

      {filters.length > 0 ? (
        <form
          className="grid gap-3 border-y border-separator bg-surface-secondary/60 p-4 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]"
          onSubmit={handleApplyFilters}
        >
          {filters.map(filter => {
            if (filter.type === 'search') {
              return (
                <TextField
                  key={filter.id}
                  className={cn('flex flex-col gap-2', filter.className)}
                  value={String(draftFilters[filter.id] ?? '')}
                  onChange={value =>
                    setDraftFilters(current => ({
                      ...current,
                      [filter.id]: value
                    }))
                  }
                >
                  <Label>{filter.label}</Label>
                  <Input placeholder={filter.placeholder} variant="secondary" />
                </TextField>
              )
            }

            if (filter.type === 'select') {
              return (
                <Select
                  key={filter.id}
                  className={cn('flex flex-col gap-2', filter.className)}
                  placeholder={filter.placeholder}
                  selectedKey={String(draftFilters[filter.id] ?? filter.defaultValue ?? '')}
                  variant="secondary"
                  onSelectionChange={key => {
                    if (key === null) {
                      return
                    }

                    setDraftFilters(current => ({
                      ...current,
                      [filter.id]: String(key)
                    }))
                  }}
                >
                  <Label>{filter.label}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {filter.options.map(option => (
                        <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                          {option.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              )
            }

            return (
              <div key={filter.id} className={cn('flex items-end', filter.className)}>
                <Checkbox
                  isSelected={Boolean(draftFilters[filter.id])}
                  value="true"
                  variant="secondary"
                  onChange={isSelected =>
                    setDraftFilters(current => ({
                      ...current,
                      [filter.id]: isSelected
                    }))
                  }
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>{filter.label}</Checkbox.Content>
                </Checkbox>
              </div>
            )
          })}

          <Select
            className="flex flex-col gap-2"
            placeholder="Rows"
            selectedKey={draftLimit}
            variant="secondary"
            onSelectionChange={key => {
              if (key !== null) {
                setDraftLimit(String(key))
              }
            }}
          >
            <Label>Page size</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {limitOptions.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex items-end gap-2">
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Button type="button" variant="outline" onPress={handleResetFilters}>
              Clear
            </Button>
          </div>
        </form>
      ) : null}

      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={ariaLabel} className={cn(minTableWidthClassName)}>
            <Table.Header>
              {columns.map(column => (
                <Table.Column
                  key={column.id}
                  id={column.id}
                  isRowHeader={column.isRowHeader}
                  className={column.className}
                >
                  {column.header}
                </Table.Column>
              ))}
              {renderRowActions ? (
                <Table.Column id="actions" className="text-right">
                  {rowActionsHeader}
                </Table.Column>
              ) : null}
            </Table.Header>

            <Table.Body items={rows} renderEmptyState={renderEmptyState}>
              {item => (
                <Table.Row
                  id={getRowId(item)}
                  className={cn('align-top transition hover:bg-surface-secondary/70', rowClassName?.(item))}
                >
                  {columns.map(column => (
                    <Table.Cell key={`${getRowId(item)}-${column.id}`} className={column.cellClassName}>
                      {column.render(item)}
                    </Table.Cell>
                  ))}
                  {renderRowActions ? (
                    <Table.Cell>
                      <div className="flex justify-end gap-2">{renderRowActions(item)}</div>
                    </Table.Cell>
                  ) : null}
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <div ref={loadMoreRef} className="flex items-center justify-center border-t border-separator px-4 py-4">
        {tableQuery.hasNextPage ? (
          <Button
            isPending={tableQuery.isFetchingNextPage}
            size="sm"
            variant="outline"
            onPress={() => void tableQuery.fetchNextPage()}
          >
            Load more
          </Button>
        ) : (
          <span className="text-xs text-muted">{rows.length > 0 ? 'End of list' : 'No rows loaded'}</span>
        )}
      </div>
    </Card>
  )
}
