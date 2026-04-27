'use client'

import { canRemoveMemberships, canUpdateMembershipRoles } from '@/lib/memberships/membership-permissions'
import { Card, Table } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { MembershipResponse } from '@pulselane/contracts/memberships'

import { MembershipRemoveButton } from './membership-remove-button'
import { MembershipRoleForm } from './membership-role-form'

type MembershipsTableProps = {
  items: MembershipResponse[]
  currentRole: MembershipRole
  currentUserId: string
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function MembershipsTable({ items, currentRole, currentUserId }: MembershipsTableProps) {
  const allowRoleUpdate = canUpdateMembershipRoles(currentRole)
  const allowRemove = canRemoveMemberships(currentRole)

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Members list</Card.Title>
        <Card.Description className="text-sm text-muted">
          Users with access to the active organization and their current roles.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Members list">
              <Table.Header>
                <Table.Column id="member" isRowHeader>
                  Member
                </Table.Column>
                <Table.Column id="email">Email</Table.Column>
                <Table.Column id="role">Role</Table.Column>
                <Table.Column id="joined">Joined</Table.Column>
                <Table.Column id="actions" className="text-right">
                  Actions
                </Table.Column>
              </Table.Header>

              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <span className="block px-4 py-8 text-center text-sm text-muted">No members to display.</span>
                )}
              >
                {membership => {
                  const isCurrentUser = membership.userId === currentUserId
                  const disableDangerousSelfAction = isCurrentUser && membership.role === 'owner'

                  return (
                    <Table.Row id={membership.id} className="align-top">
                      <Table.Cell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{membership.user.name}</span>
                          <span className="text-xs text-muted">{membership.userId}</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell>{membership.user.email}</Table.Cell>

                      <Table.Cell>
                        {allowRoleUpdate ? (
                          <MembershipRoleForm membership={membership} isDisabled={disableDangerousSelfAction} />
                        ) : (
                          <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                            {membership.role}
                          </span>
                        )}
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap">{formatDatetime(membership.createdAt)}</Table.Cell>

                      <Table.Cell>
                        <div className="flex justify-end">
                          <MembershipRemoveButton
                            membershipId={membership.id}
                            memberName={membership.user.name}
                            isDisabled={!allowRemove || disableDangerousSelfAction}
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
