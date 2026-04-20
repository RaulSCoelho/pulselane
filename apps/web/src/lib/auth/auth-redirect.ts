import { DEFAULT_AUTHENTICATED_PATH, LOGIN_PATH, NEXT_AUTH_API_PREFIX } from '@/lib/auth/auth.constants'

export function sanitizeRedirectTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/')) {
    return DEFAULT_AUTHENTICATED_PATH
  }

  try {
    const url = new URL(value, 'http://localhost')

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return DEFAULT_AUTHENTICATED_PATH
  }
}

export function buildLoginRedirectPath(redirectTo: string | null | undefined): string {
  const safeRedirectTo = sanitizeRedirectTo(redirectTo)

  return `${LOGIN_PATH}?redirectTo=${encodeURIComponent(safeRedirectTo)}`
}

export function buildRefreshRedirectPath(redirectTo: string | null | undefined): string {
  const safeRedirectTo = sanitizeRedirectTo(redirectTo)

  return `${NEXT_AUTH_API_PREFIX}/refresh?redirectTo=${encodeURIComponent(safeRedirectTo)}`
}
