import type { MembershipRole } from '@pulselane/contracts'

export function canManageMemberships(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}

export function canUpdateMembershipRoles(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}

export function canRemoveMemberships(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
