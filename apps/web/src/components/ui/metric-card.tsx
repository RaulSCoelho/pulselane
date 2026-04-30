import { Card } from '@heroui/react'
import type { ReactNode } from 'react'

type MetricCardProps = {
  label: ReactNode
  value: ReactNode
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card className="border border-border" variant="secondary">
      <Card.Content className="p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-2 text-sm font-medium">{value}</p>
      </Card.Content>
    </Card>
  )
}

type KeyValueListCardProps = {
  items: Array<{
    label: ReactNode
    value: ReactNode
  }>
}

export function KeyValueListCard({ items }: KeyValueListCardProps) {
  return (
    <Card className="border border-border" variant="secondary">
      <Card.Content className="grid grid-cols-2 gap-3 p-4 text-sm">
        {items.map(item => (
          <span key={String(item.label)} className="contents">
            <span className="text-muted">{item.label}</span>
            <span className="text-right font-medium">{item.value}</span>
          </span>
        ))}
      </Card.Content>
    </Card>
  )
}

type MetadataSummaryCardProps = {
  items: Array<{
    label: ReactNode
    value: ReactNode
  }>
  className?: string
}

export function MetadataSummaryCard({ items, className }: MetadataSummaryCardProps) {
  return (
    <Card className={className} variant="tertiary">
      <Card.Content className="grid gap-3 p-4 md:grid-cols-3">
        {items.map(item => (
          <div key={String(item.label)}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
            <p className="mt-1 text-sm text-foreground">{item.value}</p>
          </div>
        ))}
      </Card.Content>
    </Card>
  )
}
