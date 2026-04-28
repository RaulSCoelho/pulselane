export function invitationsCacheTag(organizationId: string) {
  return `organizations:${organizationId}:invitations`
}

export function invitationCacheTag(organizationId: string, invitationId: string) {
  return `organizations:${organizationId}:invitations:${invitationId}`
}
