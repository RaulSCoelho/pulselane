import {
  ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS,
  ACTIVE_ORGANIZATION_COOKIE_NAME
} from './organization-context-constants'

type CookieResponse = {
  cookies: {
    set(options: { name: string; value: string; maxAge: number; sameSite: 'lax'; path: string }): void
  }
}

export function setActiveOrganizationCookie(response: CookieResponse, organizationId: string) {
  response.cookies.set({
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: organizationId,
    maxAge: ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_IN_SECONDS,
    sameSite: 'lax',
    path: '/'
  })
}

export function clearActiveOrganizationCookie(response: CookieResponse) {
  response.cookies.set({
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    sameSite: 'lax',
    path: '/'
  })
}
