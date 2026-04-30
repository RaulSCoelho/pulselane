import { cn } from '@/lib/styles'
import { Table } from '@heroui/react'
import type { ReactNode } from 'react'

import { SectionCard } from './section-card'

type DataTableCardProps = {
  title: ReactNode
  description: ReactNode
  ariaLabel: string
  children: ReactNode
}

export function DataTableCard({ title, description, ariaLabel, children }: DataTableCardProps) {
  return (
    <SectionCard title={title} description={description}>
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={ariaLabel}>{children}</Table.Content>
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
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="font-medium">{primary}</span>
      {secondary ? <span className="text-xs text-muted">{secondary}</span> : null}
    </div>
  )
}

type StatusPillProps = {
  children: ReactNode
  className?: string
}

export function StatusPill({ children, className }: StatusPillProps) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground', className)}>
      {children}
    </span>
  )
}
