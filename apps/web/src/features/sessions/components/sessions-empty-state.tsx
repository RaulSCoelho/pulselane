import { Card } from '@heroui/react'

export function SessionsEmptyState() {
  return (
    <Card className="border border-border">
      <Card.Content className="flex flex-col gap-2 p-8 text-center">
        <h2 className="text-xl font-medium tracking-normal">No sessions found</h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
          Your account should have at least the current authenticated session. If this appears empty, refresh the page
          or sign in again.
        </p>
      </Card.Content>
    </Card>
  )
}
