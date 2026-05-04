import { PageHeader } from '@/components/ui/page-header'
import { listInvitations } from '@/features/invitations/api/server-queries'
import { InvitationCreateModal } from '@/features/invitations/components/invitation-create-modal'
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organization access"
        title="Invitations"
        description="Create, resend and revoke organization invitations before they become active memberships."
        actions={allowCreate ? <InvitationCreateModal /> : null}
      />

      {!allowCreate ? (
        <Card className="border border-border">
          <Card.Content className="p-4">
            <p className="text-sm font-medium text-warning">
              Your role can inspect invitations, but cannot create, resend or revoke them.
            </p>
          </Card.Content>
        </Card>
      ) : null}

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
        <div className="flex justify-stretch sm:justify-end">
          <Link
            href={`/app/invitations?${new URLSearchParams({
              ...(query.email ? { email: query.email } : {}),
              ...(query.status ? { status: query.status } : {}),
              limit: String(query.limit),
              cursor: invitationsState.data.meta.nextCursor
            }).toString()}`}
            className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}
          >
            Load next page
          </Link>
        </div>
      ) : null}
    </div>
  )
}
