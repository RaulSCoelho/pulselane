export function projectsCacheTag(organizationId: string) {
  return `organizations:${organizationId}:projects`
}

export function projectCacheTag(organizationId: string, projectId: string) {
  return `organizations:${organizationId}:projects:${projectId}`
}
