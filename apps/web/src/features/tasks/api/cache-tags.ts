export function tasksCacheTag(organizationId: string) {
  return `organizations:${organizationId}:tasks`
}

export function taskCacheTag(organizationId: string, taskId: string) {
  return `organizations:${organizationId}:tasks:${taskId}`
}
