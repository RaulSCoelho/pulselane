export async function resolveAppUrl(path: string): Promise<string> {
  const normalizedPath = path.replace(/^\/+|\/+$/g, '')

  if (typeof window !== 'undefined') {
    return `/${normalizedPath}`
  }

  const { headers } = await import('next/headers')
  const incomingHeaders = await headers()
  const proto = incomingHeaders.get('x-forwarded-proto') ?? 'http'
  const host = incomingHeaders.get('x-forwarded-host') ?? incomingHeaders.get('host')

  if (!host) {
    throw new Error('Could not resolve request host on server')
  }

  return `${proto}://${host}/${normalizedPath}`
}
