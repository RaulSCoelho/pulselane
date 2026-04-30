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
    <Card className={cn('border border-black/5', className)}>
      {hasHeader ? (
        <Card.Header className={cn('flex flex-col gap-2 p-8 pb-0', headerClassName)}>
          {title ? (
            <Card.Title className={cn('text-2xl font-semibold tracking-tight', titleClassName)}>{title}</Card.Title>
          ) : null}
          {description ? (
            <Card.Description className={cn('text-sm leading-6 text-muted', descriptionClassName)}>
              {description}
            </Card.Description>
          ) : null}
        </Card.Header>
      ) : null}

      <Card.Content className={cn('p-8', contentClassName)}>{children}</Card.Content>
    </Card>
  )
}
