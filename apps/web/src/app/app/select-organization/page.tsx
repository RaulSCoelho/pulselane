import { requireAuth } from '@/features/auth/api/server-queries'
import { OrganizationSelectorForm } from '@/features/organizations/components/organization-selector-form'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { Card } from '@heroui/react'

export default async function SelectOrganizationPage() {
  const me = await requireAuth({ redirectTo: '/app/select-organization' })
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  return (
    <div className="flex flex-col gap-6">
      <Card className="min-w-0 border border-border">
        <Card.Content className="flex min-w-0 flex-col gap-3 p-5 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization context</span>
          <h1 className="font-semibold tracking-normal">Select the active organization</h1>
          <p className="text-sm leading-6 text-muted">
            Choose which tenant will be used for the operational requests in this session.
          </p>
        </Card.Content>
      </Card>

      <OrganizationSelectorForm memberships={me.memberships} activeOrganizationId={activeOrganizationId} />
    </div>
  )
}
