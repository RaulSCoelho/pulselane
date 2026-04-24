import { SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { buttonVariants, Card } from '@heroui/react'
import Link from 'next/link'

export function OrganizationContextEmptyState() {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-4 p-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization context</span>
          <h2 className="text-2xl font-semibold tracking-tight">Choose the active organization</h2>
          <p className="text-sm leading-6 text-muted">
            Pulselane is multi-tenant and the operational modules depend on an active organization context.
          </p>
        </div>

        <div>
          <Link href={SELECT_ORGANIZATION_PATH} className={buttonVariants({ variant: 'primary', size: 'md' })}>
            Select organization
          </Link>
        </div>
      </Card.Content>
    </Card>
  )
}
