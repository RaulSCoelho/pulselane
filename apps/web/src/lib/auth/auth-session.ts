export function isAccessTokenExpired(accessTokenExpiresAt: string, bufferInSeconds = 60): boolean {
  try {
    const expiresAt = new Date(accessTokenExpiresAt).getTime()
    const now = Date.now()

    return now >= expiresAt - bufferInSeconds * 1000
  } catch {
    return true
  }
}
