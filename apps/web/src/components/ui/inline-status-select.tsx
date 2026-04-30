'use client'

import type { DataTableFilterOption } from '@/components/ui/remote-data-table'
import { Label, ListBox, Select } from '@heroui/react'

type InlineStatusSelectProps<TStatus extends string> = {
  label: string
  value: TStatus
  options: ReadonlyArray<DataTableFilterOption & { id: TStatus }>
  isDisabled?: boolean
  onChange: (status: TStatus) => void
}

export function InlineStatusSelect<TStatus extends string>({
  label,
  value,
  options,
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
      <Select.Trigger className="min-h-8 rounded-full px-3 py-1 text-xs font-medium capitalize">
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
