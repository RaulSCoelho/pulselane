import { NextResponse } from 'next/server'

export function getSetCookieHeaders({ headers }: Response) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const single = headers.get('set-cookie')
  return single ? [single] : []
}

export function getCookieValueFromSetCookie(setCookieHeader: string, cookieName: string) {
  const [cookiePair] = setCookieHeader.split(';')
  const separatorIndex = cookiePair.indexOf('=')

  if (separatorIndex === -1) {
    return null
  }

  const name = cookiePair.slice(0, separatorIndex).trim()
  const value = cookiePair.slice(separatorIndex + 1).trim()

  if (name !== cookieName) {
    return null
  }

  return value
}

export function getCookieFromResponse(response: Response, cookieName: string) {
  const setCookieHeaders = getSetCookieHeaders(response)

  for (const setCookieHeader of setCookieHeaders) {
    const value = getCookieValueFromSetCookie(setCookieHeader, cookieName)

    if (value) {
      return value
    }
  }

  return null
}

export function appendSetCookies(from: Response, to: NextResponse) {
  const setCookies = getSetCookieHeaders(from)

  for (const cookie of setCookies) {
    to.headers.append('set-cookie', cookie)
  }

  return to
}

export function getCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return null

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=')
    if (separatorIndex === -1) continue

    const name = cookie.slice(0, separatorIndex).trim()
    const value = cookie.slice(separatorIndex + 1).trim()

    if (name === cookieName) return value
  }

  return null
}

export function mergeCookieHeader(existing: string | null, overrides: Record<string, string>) {
  const existingParsed = Object.fromEntries(
    (existing ?? '')
      .split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const separatorIndex = c.indexOf('=')
        return [c.slice(0, separatorIndex).trim(), c.slice(separatorIndex + 1).trim()] as [string, string]
      })
  )

  const merged = { ...existingParsed, ...overrides }

  return Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}
