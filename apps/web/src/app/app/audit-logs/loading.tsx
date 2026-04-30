import { Card, Skeleton } from '@heroui/react'

export default function AuditLogsLoadingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-8">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-9 w-64 rounded" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-8 lg:grid-cols-5">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="grid gap-3 p-8">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </Card.Content>
      </Card>
    </div>
  )
}
