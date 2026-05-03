import { PageHeader } from '@/components/ui/page-header'
import { listMemberships } from '@/features/memberships/api/server-queries'
import { MembershipsEmptyState } from '@/features/memberships/components/memberships-empty-state'
import { MembershipsFilterForm } from '@/features/memberships/components/memberships-filter-form'
import { MembershipsTable } from '@/features/memberships/components/memberships-table'
import { MembershipsUnavailableState } from '@/features/memberships/components/memberships-unavailable-state'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { getAuthSession } from '@/lib/auth/auth-session'
import { getUserIdFromAccessToken } from '@/lib/auth/auth-token'
import { canManageMemberships } from '@/lib/memberships/membership-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listMembershipsQuerySchema } from '@pulselane/contracts/memberships'
import Link from 'next/link'

type MembersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentUserId = getUserIdFromAccessToken((await getAuthSession())?.accessToken ?? '')!
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

  const rawQuery = {
    search: readSearchParam(resolvedSearchParams, 'search'),
    role:
      readSearchParam(resolvedSearchParams, 'role') && readSearchParam(resolvedSearchParams, 'role') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'role')
        : undefined,
    cursor: readSearchParam(resolvedSearchParams, 'cursor'),
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listMembershipsQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listMembershipsQuerySchema.parse({ limit: '20' })
  const membershipsState = await listMemberships(query)

  const hasFilters = Boolean(query.search || query.role || query.cursor)
  const allowManage = canManageMemberships(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organization access"
        title="Members"
        description="Manage the users who can access the active organization and control operational permissions through roles."
      />

      {!allowManage ? (
        <Card className="border border-border">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">
              Your role can inspect members, but cannot update roles or remove users.
            </p>
          </Card.Content>
        </Card>
      ) : null}

      <MembershipsFilterForm search={query.search ?? ''} role={query.role ?? 'all'} />

      {membershipsState.status === 'ready' ? (
        membershipsState.data.items.length > 0 ? (
          <MembershipsTable
            items={membershipsState.data.items}
            currentRole={currentOrganization.currentRole}
            currentUserId={currentUserId}
          />
        ) : (
          <MembershipsEmptyState hasFilters={hasFilters} />
        )
      ) : (
        <MembershipsUnavailableState reason={membershipsState.reason} />
      )}

      {membershipsState.status === 'ready' &&
      membershipsState.data.meta.hasNextPage &&
      membershipsState.data.meta.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/app/members?${new URLSearchParams({
              ...(query.search ? { search: query.search } : {}),
              ...(query.role ? { role: query.role } : {}),
              limit: String(query.limit),
              cursor: membershipsState.data.meta.nextCursor
            }).toString()}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Load next page
          </Link>
        </div>
      ) : null}
    </div>
  )
}
