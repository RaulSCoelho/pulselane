import type { MembershipRole } from '@pulselane/contracts'

export function canCreateTasks(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canEditTasks(role: MembershipRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canArchiveTasks(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
