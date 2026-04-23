import { OrganizationSelectorForm } from '@/components/organizations/organization-selector-form'
import { requireAuth } from '@/lib/auth/auth-guard'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { Card } from '@heroui/react'

export default async function SelectOrganizationPage() {
  const me = await requireAuth({ redirectTo: '/app/select-organization' })
  const activeOrganizationId = await getActiveOrganizationIdFromServerCookies()

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-3 p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization context</span>
          <h1 className="text-3xl font-semibold tracking-tight">Select the active organization</h1>
          <p className="text-sm leading-6 text-muted">
            Choose which tenant will be used for the operational requests in this session.
          </p>
        </Card.Content>
      </Card>

      <OrganizationSelectorForm memberships={me.memberships} activeOrganizationId={activeOrganizationId} />
    </div>
  )
}
