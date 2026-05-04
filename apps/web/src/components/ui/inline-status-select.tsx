'use client'

import type { DataTableFilterOption } from '@/components/ui/remote-data-table'
import { cn } from '@/lib/styles'
import { Label, ListBox, Select } from '@heroui/react'

type InlineStatusTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

type InlineStatusSelectProps<TStatus extends string> = {
  label: string
  value: TStatus
  options: ReadonlyArray<DataTableFilterOption & { id: TStatus }>
  tone?: InlineStatusTone
  isDisabled?: boolean
  onChange: (status: TStatus) => void
}

const toneClassNames: Record<InlineStatusTone, string> = {
  default: 'border-border bg-surface-secondary text-muted',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info'
}

export function InlineStatusSelect<TStatus extends string>({
  label,
  value,
  options,
  tone = 'default',
  isDisabled = false,
  onChange
}: InlineStatusSelectProps<TStatus>) {
  return (
    <Select
      aria-label={label}
      className="min-w-36"
      isDisabled={isDisabled}
      selectedKey={value}
      variant="secondary"
      onSelectionChange={key => {
        if (key === null) {
          return
        }

        const nextStatus = String(key) as TStatus

        if (nextStatus !== value) {
          onChange(nextStatus)
        }
      }}
    >
      <Select.Trigger
        className={cn('min-h-8 rounded-full px-3 py-1 text-xs font-medium capitalize', toneClassNames[tone])}
      >
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(option => (
            <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
              <Label>{option.label}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}
