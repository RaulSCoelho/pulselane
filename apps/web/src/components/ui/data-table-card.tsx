import { cn } from '@/lib/styles'
import { Table } from '@heroui/react'
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

export function StatusPill({ children, tone = 'default', className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-medium capitalize',
        'max-w-full whitespace-nowrap',
        tone === 'default' && 'border-border bg-surface-secondary text-muted',
        tone === 'success' && 'border-success/25 bg-success/10 text-success',
        tone === 'warning' && 'border-warning/25 bg-warning/10 text-warning',
        tone === 'danger' && 'border-danger/25 bg-danger/10 text-danger',
        tone === 'info' && 'border-info/25 bg-info/10 text-info',
        className
      )}
    >
      {children}
    </span>
  )
}
