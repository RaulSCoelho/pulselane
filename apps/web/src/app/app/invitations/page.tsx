import { listInvitations } from '@/features/invitations/api/server-queries'
import { InvitationCreateForm } from '@/features/invitations/components/invitation-create-form'
import { InvitationsEmptyState } from '@/features/invitations/components/invitations-empty-state'
import { InvitationsFilterForm } from '@/features/invitations/components/invitations-filter-form'
import { InvitationsTable } from '@/features/invitations/components/invitations-table'
import { InvitationsUnavailableState } from '@/features/invitations/components/invitations-unavailable-state'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { canCreateInvitations } from '@/lib/invitations/invitation-permissions'
import { Card, buttonVariants } from '@heroui/react'
import { listInvitationsQuerySchema } from '@pulselane/contracts/invitations'
import Link from 'next/link'

type InvitationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

  const rawQuery = {
    email: readSearchParam(resolvedSearchParams, 'email') || undefined,
    status:
      readSearchParam(resolvedSearchParams, 'status') && readSearchParam(resolvedSearchParams, 'status') !== 'all'
        ? readSearchParam(resolvedSearchParams, 'status')
        : undefined,
    cursor: readSearchParam(resolvedSearchParams, 'cursor'),
    limit: readSearchParam(resolvedSearchParams, 'limit') ?? '20'
  }

  const parsedQuery = listInvitationsQuerySchema.safeParse(rawQuery)
  const query = parsedQuery.success ? parsedQuery.data : listInvitationsQuerySchema.parse({ limit: '20' })
  const invitationsState = await listInvitations(query)

  const hasFilters = Boolean(query.email || query.status || query.cursor)
  const allowCreate = canCreateInvitations(currentOrganization.currentRole)
  const loadedNow = invitationsState.status === 'ready' ? invitationsState.data.items.length : 'Unavailable'

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization access</span>
            <h1 className="text-3xl font-semibold tracking-tight">Invitations</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Create, resend and revoke organization invitations before they become active memberships.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current role</p>
                <p className="mt-2 text-sm font-medium">{currentOrganization.currentRole}</p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Members usage</p>
                <p className="mt-2 text-sm font-medium">
                  {currentOrganization.usage.members}
                  {currentOrganization.limits.members !== null ? ` / ${currentOrganization.limits.members}` : ''}
                </p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Loaded now</p>
                <p className="mt-2 text-sm font-medium">{loadedNow}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      {!allowCreate ? (
        <Card className="border border-black/5">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">
              Your role can inspect invitations, but cannot create, resend or revoke them.
            </p>
          </Card.Content>
        </Card>
      ) : null}

      {allowCreate ? <InvitationCreateForm /> : null}

      <InvitationsFilterForm email={query.email ?? ''} status={query.status ?? 'all'} />

      {invitationsState.status === 'ready' ? (
        invitationsState.data.items.length > 0 ? (
          <InvitationsTable items={invitationsState.data.items} currentRole={currentOrganization.currentRole} />
        ) : (
          <InvitationsEmptyState hasFilters={hasFilters} />
        )
      ) : (
        <InvitationsUnavailableState reason={invitationsState.reason} />
      )}

      {invitationsState.status === 'ready' &&
      invitationsState.data.meta.hasNextPage &&
      invitationsState.data.meta.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/app/invitations?${new URLSearchParams({
              ...(query.email ? { email: query.email } : {}),
              ...(query.status ? { status: query.status } : {}),
              limit: String(query.limit),
              cursor: invitationsState.data.meta.nextCursor
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
