import { Card, Skeleton } from '@heroui/react'

export default function InvitationAcceptLoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      <Card className="w-full max-w-2xl min-w-0 border border-border shadow-sm">
        <Card.Content className="grid gap-4 p-5 sm:p-8">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-9 w-80 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-12 rounded-xl" />
        </Card.Content>
      </Card>
    </main>
  )
}
