'use client'

import { DataTableCard, StatusPill, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { InvitationResendButton } from '@/features/invitations/components/invitation-resend-button'
import { InvitationRevokeButton } from '@/features/invitations/components/invitation-revoke-button'
import { formatDateTime } from '@/lib/formatters'
import { INVITATION_ACCEPT_PATH } from '@/lib/invitations/invitation-accept-constants'
import { canResendInvitations, canRevokeInvitations } from '@/lib/invitations/invitation-permissions'
import { Table } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { InvitationResponse } from '@pulselane/contracts/invitations'

type InvitationsTableProps = {
  items: InvitationResponse[]
  currentRole: MembershipRole
}

function buildAcceptPath(token: string) {
  return `${INVITATION_ACCEPT_PATH}?token=${encodeURIComponent(token)}`
}

export function InvitationsTable({ items, currentRole }: InvitationsTableProps) {
  const allowResend = canResendInvitations(currentRole)
  const allowRevoke = canRevokeInvitations(currentRole)

  return (
    <DataTableCard
      title="Invitations list"
      description="Pending and historical invitations for the active organization."
      ariaLabel="Invitations list"
    >
      <Table.Header>
        <Table.Column id="email" isRowHeader>
          Email
        </Table.Column>
        <Table.Column id="role">Role</Table.Column>
        <Table.Column id="status">Status</Table.Column>
        <Table.Column id="expires">Expires</Table.Column>
        <Table.Column id="accept">Accept path</Table.Column>
        <Table.Column id="actions" className="text-right">
          Actions
        </Table.Column>
      </Table.Header>

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No invitations to display.</TableEmptyState>}>
        {invitation => {
          const canResend = allowResend && (invitation.status === 'pending' || invitation.status === 'expired')
          const canRevoke = allowRevoke && invitation.status === 'pending'

          return (
            <Table.Row id={invitation.id} className="align-top">
              <Table.Cell>
                <TableIdentity primary={invitation.email} secondary={`Invited by ${invitation.invitedBy.name}`} />
              </Table.Cell>

              <Table.Cell>
                <StatusPill>{invitation.role}</StatusPill>
              </Table.Cell>

              <Table.Cell>
                <StatusPill>{invitation.status}</StatusPill>
              </Table.Cell>

              <Table.Cell className="whitespace-nowrap">{formatDateTime(invitation.expiresAt)}</Table.Cell>

              <Table.Cell>
                <code className="block max-w-72 truncate rounded-lg bg-surface-secondary px-2 py-1 text-xs text-foreground">
                  {buildAcceptPath(invitation.token)}
                </code>
              </Table.Cell>

              <Table.Cell>
                <div className="flex justify-end gap-2">
                  <InvitationResendButton invitationId={invitation.id} isDisabled={!canResend} />

                  <InvitationRevokeButton
                    invitationId={invitation.id}
                    email={invitation.email}
                    isDisabled={!canRevoke}
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          )
        }}
      </Table.Body>
    </DataTableCard>
  )
}
