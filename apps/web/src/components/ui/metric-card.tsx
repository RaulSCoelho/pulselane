import { cn } from '@/lib/styles'
import { Card, Meter } from '@heroui/react'
import type { ReactNode } from 'react'

type MetricCardTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'cyan' | 'orange'

type MetricCardProps = {
  label: ReactNode
  value: ReactNode
  detail?: ReactNode
  tone?: MetricCardTone
  meter?: {
    value: number
    label: string
  }
}

const metricToneClassNames: Record<
  MetricCardTone,
  {
    card: string
    value: string
    bar: string
  }
> = {
  default: {
    card: 'border-border bg-surface',
    value: 'text-foreground',
    bar: 'bg-muted'
  },
  success: {
    card: 'border-success/25 bg-success/5',
    value: 'text-success',
    bar: 'bg-success'
  },
  warning: {
    card: 'border-warning/30 bg-warning/5',
    value: 'text-warning',
    bar: 'bg-warning'
  },
  danger: {
    card: 'border-danger/30 bg-danger/5',
    value: 'text-danger',
    bar: 'bg-danger'
  },
  info: {
    card: 'border-info/25 bg-info/5',
    value: 'text-info',
    bar: 'bg-info'
  },
  accent: {
    card: 'border-accent/25 bg-accent/5',
    value: 'text-accent',
    bar: 'bg-accent'
  },
  cyan: {
    card: 'border-brand-cyan/30 bg-brand-cyan/5',
    value: 'text-brand-cyan',
    bar: 'bg-brand-cyan'
  },
  orange: {
    card: 'border-brand-orange/30 bg-brand-orange/5',
    value: 'text-brand-orange',
    bar: 'bg-brand-orange'
  }
}

const meterColorMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'accent',
  accent: 'accent',
  cyan: 'accent',
  orange: 'warning'
} satisfies Record<MetricCardTone, 'default' | 'accent' | 'success' | 'warning' | 'danger'>

export function MetricCard({ label, value, detail, tone = 'default', meter }: MetricCardProps) {
  const toneClasses = metricToneClassNames[tone]
  const meterValue = Math.max(0, Math.min(100, meter?.value ?? 0))

  return (
    <Card className={cn('min-w-0 border shadow-surface', toneClasses.card)} variant="secondary">
      <Card.Content className="p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className={cn('mt-2 text-sm font-semibold capitalize wrap-break-word', toneClasses.value)}>{value}</p>
        {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
        {meter ? (
          <Meter
            aria-label={meter.label}
            className="mt-3"
            color={meterColorMap[tone]}
            size="sm"
            value={meterValue}
            valueLabel={meter.label}
          >
            <Meter.Track className="h-1.5 bg-surface-tertiary">
              <Meter.Fill className={toneClasses.bar} />
            </Meter.Track>
          </Meter>
        ) : null}
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
    <Card className="min-w-0 border border-border" variant="secondary">
      <Card.Content className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 text-sm">
        {items.map(item => (
          <span key={String(item.label)} className="contents">
            <span className="min-w-0 text-muted wrap-break-word">{item.label}</span>
            <span className="min-w-0 text-right font-medium wrap-break-word">{item.value}</span>
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
    <Card className={cn('min-w-0', className)} variant="tertiary">
      <Card.Content className="grid gap-3 p-4 md:grid-cols-3">
        {items.map(item => (
          <div key={String(item.label)} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
            <p className="mt-1 text-sm text-foreground wrap-break-word">{item.value}</p>
          </div>
        ))}
      </Card.Content>
    </Card>
  )
}
