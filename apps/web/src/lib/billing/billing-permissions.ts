import type { MembershipRole } from '@pulselane/contracts'

export function canManageBilling(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
