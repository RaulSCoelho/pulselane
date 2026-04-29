export function sessionsCacheTag(userId: string) {
  return `users:${userId}:sessions`
}
