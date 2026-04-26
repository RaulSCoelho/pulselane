import type { MembershipRole } from '@pulselane/contracts'

export function canCreateComments(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canEditComments(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canDeleteComments(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}
