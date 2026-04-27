export function membershipsCacheTag(organizationId: string) {
  return `organizations:${organizationId}:memberships`
}

export function membershipCacheTag(organizationId: string, membershipId: string) {
  return `organizations:${organizationId}:memberships:${membershipId}`
}
