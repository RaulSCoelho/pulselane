'use client'

import { InvitationResendButton } from '@/features/invitations/components/invitation-resend-button'
import { InvitationRevokeButton } from '@/features/invitations/components/invitation-revoke-button'
import { canResendInvitations, canRevokeInvitations } from '@/lib/invitations/invitation-permissions'
import { Card, Table } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { InvitationResponse } from '@pulselane/contracts/invitations'

type InvitationsTableProps = {
  items: InvitationResponse[]
  currentRole: MembershipRole
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function buildAcceptPath(token: string) {
  return `/invite/accept?token=${encodeURIComponent(token)}`
}

export function InvitationsTable({ items, currentRole }: InvitationsTableProps) {
  const allowResend = canResendInvitations(currentRole)
  const allowRevoke = canRevokeInvitations(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Invitations list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Pending and historical invitations for the active organization.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Invitations list">
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

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No invitations to display.</span>
                )}
              >
                {invitation => {
                  const canResend = allowResend && (invitation.status === 'pending' || invitation.status === 'expired')
                  const canRevoke = allowRevoke && invitation.status === 'pending'

                  return (
                    <Table.Row id={invitation.id} className="align-top">
                      <Table.Cell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{invitation.email}</span>
                          <span className="text-xs text-muted">Invited by {invitation.invitedBy.name}</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                          {invitation.role}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                          {invitation.status}
                        </span>
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap">{formatDatetime(invitation.expiresAt)}</Table.Cell>

                      <Table.Cell>
                        <code className="block max-w-72 truncate rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
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
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card.Content>
    </Card>
  )
}
