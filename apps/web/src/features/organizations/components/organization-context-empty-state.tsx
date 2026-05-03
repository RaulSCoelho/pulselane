import { SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { buttonVariants, Card } from '@heroui/react'
import Link from 'next/link'

export function OrganizationContextEmptyState() {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-4 p-5 sm:p-8">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization context</span>
          <h2 className="text-2xl font-semibold tracking-normal">Choose the active organization</h2>
          <p className="text-sm leading-6 text-muted">
            Pulselane is multi-tenant and the operational modules depend on an active organization context.
          </p>
        </div>

        <div className="flex">
          <Link href={SELECT_ORGANIZATION_PATH} className={buttonVariants({ variant: 'primary', size: 'md' })}>
            Select organization
          </Link>
        </div>
      </Card.Content>
    </Card>
  )
}
