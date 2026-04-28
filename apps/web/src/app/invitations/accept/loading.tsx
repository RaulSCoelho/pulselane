import { Card, Skeleton } from '@heroui/react'

export default function InvitationAcceptLoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
      <Card className="w-full max-w-2xl border border-black/5 shadow-sm">
        <Card.Content className="grid gap-4 p-8">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-9 w-80 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
        </Card.Content>
      </Card>
    </main>
  )
}
