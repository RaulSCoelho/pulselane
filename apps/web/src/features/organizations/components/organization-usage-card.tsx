import { Card } from '@heroui/react'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

type OrganizationUsageCardProps = {
  currentOrganization: CurrentOrganizationResponse
}

type UsageItem = {
  label: string
  usage: number
  limit: number | null
}

function formatLimit(limit: number | null) {
  return limit === null ? 'Unlimited' : String(limit)
}

function formatUsageLabel(item: UsageItem) {
  return `${item.usage} / ${formatLimit(item.limit)}`
}

export function OrganizationUsageCard({ currentOrganization }: OrganizationUsageCardProps) {
  const items: UsageItem[] = [
    {
      label: 'Members',
      usage: currentOrganization.usage.members,
      limit: currentOrganization.limits.members
    },
    {
      label: 'Clients',
      usage: currentOrganization.usage.clients,
      limit: currentOrganization.limits.clients
    },
    {
      label: 'Projects',
      usage: currentOrganization.usage.projects,
      limit: currentOrganization.limits.projects
    },
    {
      label: 'Active tasks',
      usage: currentOrganization.usage.activeTasks,
      limit: currentOrganization.limits.activeTasks
    }
  ]

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Usage and limits</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Backend-enforced limits for the current plan. This screen is informational; enforcement stays in the API.
        </Card.Description>
      </Card.Header>

      <Card.Content className="grid gap-3 p-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => (
          <Card key={item.label} className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{item.label}</p>
              <p className="mt-2 text-sm font-medium">{formatUsageLabel(item)}</p>
            </Card.Content>
          </Card>
        ))}
      </Card.Content>
    </Card>
  )
}
