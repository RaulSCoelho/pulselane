import { Card } from '@heroui/react'

type ProjectsEmptyStateProps = {
  hasFilters: boolean
  includeArchived: boolean
}

export function ProjectsEmptyState({ hasFilters, includeArchived }: ProjectsEmptyStateProps) {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          {hasFilters ? 'No projects match these filters' : 'No projects yet'}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          {hasFilters
            ? includeArchived
              ? 'Try clearing the filters or checking if this organization has projects under another client.'
              : 'Try including archived projects or clearing the current filters.'
            : 'Create the first project after selecting the client that owns the operational work.'}
        </p>
      </Card.Content>
    </Card>
  )
}
