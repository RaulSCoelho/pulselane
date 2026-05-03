import { Card } from '@heroui/react'

type MembershipsEmptyStateProps = {
  hasFilters: boolean
}

export function MembershipsEmptyState({ hasFilters }: MembershipsEmptyStateProps) {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 text-center sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">
          {hasFilters ? 'No members match these filters' : 'No members found'}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          {hasFilters
            ? 'Try clearing the current search or role filter.'
            : 'The active organization should have at least one owner. If this appears empty, check the organization context.'}
        </p>
      </Card.Content>
    </Card>
  )
}
