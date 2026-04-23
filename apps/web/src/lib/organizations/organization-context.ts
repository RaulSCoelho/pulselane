import { ACTIVE_ORGANIZATION_COOKIE_NAME } from './organization-context-constants'

function normalizeCookieHeader(cookieHeader: string | null | undefined): string {
  return cookieHeader ?? ''
}

export function readCookieValue(cookieHeader: string | null | undefined, cookieName: string): string | null {
  const normalizedHeader = normalizeCookieHeader(cookieHeader)

  if (!normalizedHeader) {
    return null
  }

  const cookies = normalizedHeader
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = cookie.slice(0, separatorIndex).trim()
    const value = cookie.slice(separatorIndex + 1).trim()

    if (key === cookieName) {
      return decodeURIComponent(value)
    }
  }

  return null
}

export function readActiveOrganizationIdFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  return readCookieValue(cookieHeader, ACTIVE_ORGANIZATION_COOKIE_NAME)
}

export function readActiveOrganizationIdFromDocument(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  return readActiveOrganizationIdFromCookieHeader(document.cookie)
}
