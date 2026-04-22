export const REQUEST_SNAPSHOT_ENDPOINT = '/api/internal/snapshots'
export const REQUEST_SNAPSHOT_COOKIE_NAME = 'request_snapshot'
export const REQUEST_SNAPSHOT_MAX_AGE_SECONDS = 60 * 10 // 10 minutes

export function buildRequestSnapshotKey(url: string, method = 'GET'): string | null {
  try {
    const normalizedMethod = method.toUpperCase()

    if (normalizedMethod !== 'GET') {
      return null
    }

    const parsedUrl = new URL(url, 'http://localhost')
    const searchParams = new URLSearchParams(parsedUrl.search)
    const sortedEntries = Array.from(searchParams.entries()).sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA === keyB) {
        return valueA.localeCompare(valueB)
      }

      return keyA.localeCompare(keyB)
    })

    const normalizedSearch = new URLSearchParams(sortedEntries).toString()
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/'

    return normalizedSearch.length > 0
      ? `${normalizedMethod}:${normalizedPath}?${normalizedSearch}`
      : `${normalizedMethod}:${normalizedPath}`
  } catch {
    return null
  }
}
