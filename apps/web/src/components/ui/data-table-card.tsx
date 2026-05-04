import { cn } from '@/lib/styles'
import { Chip, Table } from '@heroui/react'
import type { ReactNode } from 'react'

import { SectionCard } from './section-card'

type DataTableCardProps = {
  title: ReactNode
  description: ReactNode
  ariaLabel: string
  children: ReactNode
  minTableWidthClassName?: string
}

export function DataTableCard({
  title,
  description,
  ariaLabel,
  children,
  minTableWidthClassName = 'min-w-180'
}: DataTableCardProps) {
  return (
    <SectionCard title={title} description={description} className="overflow-hidden" contentClassName="p-0 sm:p-0">
      <Table variant="secondary">
        <Table.ScrollContainer className="max-w-full overflow-x-auto">
          <Table.Content aria-label={ariaLabel} className={cn('w-full', minTableWidthClassName)}>
            {children}
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </SectionCard>
  )
}

type TableEmptyStateProps = {
  children: ReactNode
}

export function TableEmptyState({ children }: TableEmptyStateProps) {
  return <span className="block px-4 py-8 text-center text-sm text-muted">{children}</span>
}

type TableIdentityProps = {
  primary: ReactNode
  secondary?: ReactNode
  className?: string
}

export function TableIdentity({ primary, secondary, className }: TableIdentityProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="font-medium break-words">{primary}</span>
      {secondary ? <span className="text-xs text-muted break-all">{secondary}</span> : null}
    </div>
  )
}

type StatusPillProps = {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const statusPillColorMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'accent'
} satisfies Record<NonNullable<StatusPillProps['tone']>, 'default' | 'accent' | 'success' | 'warning' | 'danger'>

export function StatusPill({ children, tone = 'default', className }: StatusPillProps) {
  return (
    <Chip
      color={statusPillColorMap[tone]}
      size="sm"
      variant="soft"
      className={cn(
        'max-w-full whitespace-nowrap capitalize',
        tone === 'info' && 'border-info/25 bg-info/10 text-info',
        className
      )}
    >
      {children}
    </Chip>
  )
}
