import { Card } from '@heroui/react'

type TasksEmptyStateProps = {
  hasFilters: boolean
  includeArchived: boolean
}

export function TasksEmptyState({ hasFilters, includeArchived }: TasksEmptyStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          {hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          {hasFilters
            ? includeArchived
              ? 'Try clearing filters or checking another project.'
              : 'Try including archived tasks or clearing the current filters.'
            : 'Create the first task after a project exists in the active organization.'}
        </p>
      </Card.Content>
    </Card>
  )
}
