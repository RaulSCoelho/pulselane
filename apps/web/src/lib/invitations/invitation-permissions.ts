import type { MembershipRole } from '@pulselane/contracts'

export function canCreateInvitations(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}

export function canResendInvitations(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}

export function canRevokeInvitations(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
