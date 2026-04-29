import type { MembershipRole } from '@pulselane/contracts'

export function canReadAuditLogs(role: MembershipRole) {
  return role === 'owner' || role === 'admin'
}
