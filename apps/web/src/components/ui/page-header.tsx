import { cn } from '@/lib/styles'
import type { ReactNode } from 'react'

type PageMetric = {
  label: ReactNode
  value: ReactNode
}

type PageHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  metrics?: PageMetric[]
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, metrics = [], className }: PageHeaderProps) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-5', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-medium uppercase text-muted">{eyebrow}</p> : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-[2rem]">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>

        {actions ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {metrics.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(metric => (
            <div
              key={String(metric.label)}
              className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-surface"
            >
              <p className="text-xs font-medium uppercase text-muted">{metric.label}</p>
              <p className="mt-2 text-sm font-medium break-words">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
