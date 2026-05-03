import { Card } from '@heroui/react'

export function SessionsEmptyState() {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 text-center sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">No sessions found</h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          Your account should have at least the current authenticated session. If this appears empty, refresh the page
          or sign in again.
        </p>
      </Card.Content>
    </Card>
  )
}
