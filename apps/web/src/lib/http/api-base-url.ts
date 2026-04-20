function normalizeApiBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
  }

  return normalizeApiBaseUrl(value)
}
