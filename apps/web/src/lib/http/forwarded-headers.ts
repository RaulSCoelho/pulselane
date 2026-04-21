import { AUTH_COOKIE_NAME } from '../auth/auth-constants'
import { getCookieValue, mergeCookieHeader } from './set-cookie'

export async function setForwardedHeaders(request: Request): Promise<void> {
  if (typeof window !== 'undefined') {
    return
  }

  const { headers } = await import('next/headers')
  const incoming = await headers()
  const outgoing = request.headers

  const incomingHasAuthCookie = incoming.get('cookie')?.includes(AUTH_COOKIE_NAME)
  const outgoingHasAuthCookie = outgoing.get('cookie')?.includes(AUTH_COOKIE_NAME)

  if (incomingHasAuthCookie && !outgoingHasAuthCookie) {
    const newCookie = mergeCookieHeader(outgoing.get('cookie'), {
      [AUTH_COOKIE_NAME]: getCookieValue(incoming.get('cookie'), AUTH_COOKIE_NAME) ?? ''
    })
    outgoing.set('cookie', newCookie)
  }

  const userAgent = incoming.get('user-agent')
  const forwardedFor = incoming.get('x-forwarded-for')
  const forwardedProto = incoming.get('x-forwarded-proto')
  const forwardedHost = incoming.get('x-forwarded-host')

  if (userAgent) outgoing.set('user-agent', userAgent)
  if (forwardedFor) outgoing.set('x-forwarded-for', forwardedFor)
  if (forwardedProto) outgoing.set('x-forwarded-proto', forwardedProto)
  if (forwardedHost) outgoing.set('x-forwarded-host', forwardedHost)
}
