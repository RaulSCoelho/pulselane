export function commentsCacheTag(organizationId: string, taskId: string) {
  return `organizations:${organizationId}:tasks:${taskId}:comments`
}

export function commentActivityHistoryCacheTag(organizationId: string, taskId: string) {
  return `organizations:${organizationId}:tasks:${taskId}:activity-history`
}

export function commentCacheTag(organizationId: string, commentId: string) {
  return `organizations:${organizationId}:comments:${commentId}`
}
