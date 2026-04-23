import { buttonVariants, Card } from '@heroui/react'
import Link from 'next/link'

type ClientsEmptyStateProps = {
  includeArchived: boolean
  hasFilters: boolean
}

export function ClientsEmptyState({ includeArchived, hasFilters }: ClientsEmptyStateProps) {
  const title = hasFilters ? 'No clients matched the current filters' : 'No clients created yet'
  const description = hasFilters
    ? 'Change the filters or clear the current search to inspect the full client base.'
    : 'This organization still has no clients. Create the first one to unlock projects and the operational flow.'

  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-4 p-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Clients</span>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>

        {hasFilters || includeArchived ? (
          <div>
            <Link href="/app/clients" className={buttonVariants({ variant: 'outline' })}>
              Reset list
            </Link>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}
