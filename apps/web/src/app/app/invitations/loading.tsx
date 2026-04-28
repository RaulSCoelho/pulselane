import { Card, Skeleton } from '@heroui/react'

export default function InvitationsLoadingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="grid gap-4 p-8">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-9 w-64 rounded" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </Card.Content>
      </Card>

      <Card className="border border-black/5">
        <Card.Content className="grid gap-4 p-8 md:grid-cols-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </Card.Content>
      </Card>

      <Card className="border border-black/5">
        <Card.Content className="grid gap-3 p-8">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </Card.Content>
      </Card>
    </div>
  )
}
