import { Card } from '@heroui/react'

type MembershipsEmptyStateProps = {
  hasFilters: boolean
}

export function MembershipsEmptyState({ hasFilters }: MembershipsEmptyStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
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
