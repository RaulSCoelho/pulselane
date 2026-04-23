import type { MembershipRole } from '@pulselane/contracts'

export function canCreateClients(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canEditClients(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canArchiveClients(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
