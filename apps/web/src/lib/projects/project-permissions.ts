import type { MembershipRole } from '@pulselane/contracts'

export function canCreateProjects(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canEditProjects(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canArchiveProjects(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
