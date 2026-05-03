import { cn } from '@/lib/styles'
import { Card } from '@heroui/react'
import type { ReactNode } from 'react'

type SectionCardProps = {
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  contentClassName?: string
}

export function SectionCard({
  title,
  description,
  children,
  className,
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName
}: SectionCardProps) {
  const hasHeader = Boolean(title || description)

  return (
    <Card className={cn('min-w-0 border border-border', className)}>
      {hasHeader ? (
        <Card.Header className={cn('flex min-w-0 flex-col gap-2', headerClassName ?? 'p-5 pb-0 sm:p-8 sm:pb-0')}>
          {title ? (
            <Card.Title className={cn('font-semibold tracking-normal', titleClassName ?? 'text-xl sm:text-2xl')}>
              {title}
            </Card.Title>
          ) : null}
          {description ? (
            <Card.Description className={cn('text-sm leading-6 text-muted', descriptionClassName)}>
              {description}
            </Card.Description>
          ) : null}
        </Card.Header>
      ) : null}

      <Card.Content className={cn('min-w-0', contentClassName ?? 'p-5 sm:p-8')}>{children}</Card.Content>
    </Card>
  )
}
