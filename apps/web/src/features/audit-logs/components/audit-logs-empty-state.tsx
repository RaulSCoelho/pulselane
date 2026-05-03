import { Card } from '@heroui/react'

type AuditLogsEmptyStateProps = {
  hasFilters: boolean
}

export function AuditLogsEmptyState({ hasFilters }: AuditLogsEmptyStateProps) {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 text-center sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">
          {hasFilters ? 'No audit logs match these filters' : 'No audit logs found'}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          {hasFilters
            ? 'Try clearing action, entity, actor, or cursor filters.'
            : 'Audit logs will appear as important organization actions are recorded by the backend.'}
        </p>
      </Card.Content>
    </Card>
  )
}
