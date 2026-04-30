import { MetricCard } from '@/components/ui/metric-card'
import { SectionCard } from '@/components/ui/section-card'
import { formatUsageLimit } from '@/lib/formatters'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'

type OrganizationUsageCardProps = {
  currentOrganization: CurrentOrganizationResponse
}

type UsageItem = {
  label: string
  usage: number
  limit: number | null
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
    <SectionCard
      title="Usage and limits"
      description="Backend-enforced limits for the current plan. This screen is informational; enforcement stays in the API."
      contentClassName="grid gap-3 p-8 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map(item => (
        <MetricCard key={item.label} label={item.label} value={formatUsageLimit(item.usage, item.limit)} />
      ))}
    </SectionCard>
  )
}
