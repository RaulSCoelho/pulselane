function normalizeUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function readFirstEnvValue(keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]

    if (value) {
      return normalizeUrl(value)
    }
  }

  return null
}

export function getServerApiUrl(): string {
  const value = readFirstEnvValue(['API_INTERNAL_URL', 'API_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_API_BASE_URL'])

  if (!value) {
    throw new Error('Missing API_INTERNAL_URL, API_URL or NEXT_PUBLIC_API_URL')
  }

  return value
}

export function getClientApiUrl(): string {
  const rawValue = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL
  const value = rawValue ? normalizeUrl(rawValue) : null

  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_URL')
  }

  return value
}
