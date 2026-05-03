'use client'

import { DataTableCard, StatusPill, TableEmptyState, TableIdentity } from '@/components/ui/data-table-card'
import { formatDateTime } from '@/lib/formatters'
import { canRemoveMemberships, canUpdateMembershipRoles } from '@/lib/memberships/membership-permissions'
import { Table } from '@heroui/react'
import type { MembershipRole } from '@pulselane/contracts'
import type { MembershipResponse } from '@pulselane/contracts/memberships'

import { MembershipRemoveButton } from './membership-remove-button'
import { MembershipRoleForm } from './membership-role-form'

type MembershipsTableProps = {
  items: MembershipResponse[]
  currentRole: MembershipRole
  currentUserId: string
}

export function MembershipsTable({ items, currentRole, currentUserId }: MembershipsTableProps) {
  const allowRoleUpdate = canUpdateMembershipRoles(currentRole)
  const allowRemove = canRemoveMemberships(currentRole)

  return (
    <DataTableCard
      title="Members list"
      description="Users with access to the active organization and their current roles."
      ariaLabel="Members list"
      minTableWidthClassName="min-w-190"
    >
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

      <Table.Body items={items} renderEmptyState={() => <TableEmptyState>No members to display.</TableEmptyState>}>
        {membership => {
          const isCurrentUser = membership.userId === currentUserId
          const disableDangerousSelfAction = isCurrentUser && membership.role === 'owner'

          return (
            <Table.Row id={membership.id} className="align-top">
              <Table.Cell>
                <TableIdentity primary={membership.user.name} secondary={membership.userId} />
              </Table.Cell>

              <Table.Cell>{membership.user.email}</Table.Cell>

              <Table.Cell>
                {allowRoleUpdate ? (
                  <MembershipRoleForm membership={membership} isDisabled={disableDangerousSelfAction} />
                ) : (
                  <StatusPill>{membership.role}</StatusPill>
                )}
              </Table.Cell>

              <Table.Cell className="whitespace-nowrap">{formatDateTime(membership.createdAt)}</Table.Cell>

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
    </DataTableCard>
  )
}
