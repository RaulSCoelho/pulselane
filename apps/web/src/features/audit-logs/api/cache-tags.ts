export function auditLogsCacheTag(organizationId: string) {
  return `organizations:${organizationId}:audit-logs`
}
