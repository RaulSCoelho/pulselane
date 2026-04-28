import type { MembershipRole } from '@pulselane/contracts'

export function canUpdateOrganization(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
