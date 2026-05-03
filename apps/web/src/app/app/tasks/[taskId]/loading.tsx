import { Card, Skeleton } from '@heroui/react'

export default function TaskDetailLoadingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-5 sm:p-8">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-9 w-72 rounded" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-5 sm:p-8 md:grid-cols-2">
          <Skeleton className="h-12 rounded-xl md:col-span-2" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-28 rounded-xl md:col-span-2" />
        </Card.Content>
      </Card>
    </div>
  )
}
