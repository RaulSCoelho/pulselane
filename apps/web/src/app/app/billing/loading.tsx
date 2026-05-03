import { Card, Skeleton } from '@heroui/react'

export default function BillingLoadingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-5 sm:p-8">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-9 w-64 rounded" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-5 sm:p-8 md:grid-cols-5">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </Card.Content>
      </Card>

      <Card className="border border-border">
        <Card.Content className="grid gap-4 p-5 sm:p-8 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </Card.Content>
      </Card>
    </div>
  )
}
