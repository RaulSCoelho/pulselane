export function clientsCacheTag(organizationId: string) {
  return `organization:${organizationId}:clients`
}

export function clientCacheTag(organizationId: string, clientId: string) {
  return `organization:${organizationId}:client:${clientId}`
}
