import { Card } from '@heroui/react'

type InvitationsEmptyStateProps = {
  hasFilters: boolean
}

export function InvitationsEmptyState({ hasFilters }: InvitationsEmptyStateProps) {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 text-center sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">
          {hasFilters ? 'No invitations match these filters' : 'No invitations yet'}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          {hasFilters
            ? 'Try clearing the current email or status filter.'
            : 'Create the first invitation to add another user to the active organization.'}
        </p>
      </Card.Content>
    </Card>
  )
}
