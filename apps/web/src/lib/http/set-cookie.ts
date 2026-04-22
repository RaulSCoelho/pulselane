import { NextResponse } from 'next/server'

type ParsedSetCookie = {
  name: string
  value: string
  attributes: Record<string, string | true>
}

function parseSetCookie(setCookieHeader: string): ParsedSetCookie | null {
  const parts = setCookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  const [cookiePair, ...attributeParts] = parts
  const separatorIndex = cookiePair.indexOf('=')

  if (separatorIndex === -1) {
    return null
  }

  const name = cookiePair.slice(0, separatorIndex).trim()
  const value = cookiePair.slice(separatorIndex + 1).trim()

  if (!name) {
    return null
  }

  const attributes: Record<string, string | true> = {}

  for (const attributePart of attributeParts) {
    const attributeSeparatorIndex = attributePart.indexOf('=')

    if (attributeSeparatorIndex === -1) {
      attributes[attributePart.toLowerCase()] = true
      continue
    }

    const attributeName = attributePart.slice(0, attributeSeparatorIndex).trim().toLowerCase()
    const attributeValue = attributePart.slice(attributeSeparatorIndex + 1).trim()

    attributes[attributeName] = attributeValue
  }

  return {
    name,
    value,
    attributes
  }
}

function splitSetCookieHeader(setCookieHeader: string): string[] {
  const cookies: string[] = []
  let current = ''
  let inExpiresAttribute = false

  for (let index = 0; index < setCookieHeader.length; index += 1) {
    const char = setCookieHeader[index]
    const remaining = setCookieHeader.slice(index).toLowerCase()

    if (!inExpiresAttribute && remaining.startsWith('expires=')) {
      inExpiresAttribute = true
    }

    if (char === ',') {
      if (inExpiresAttribute) {
        current += char
        continue
      }

      cookies.push(current.trim())
      current = ''
      continue
    }

    if (inExpiresAttribute && char === ';') {
      inExpiresAttribute = false
    }

    current += char
  }

  if (current.trim()) {
    cookies.push(current.trim())
  }

  return cookies
}

function clearLegacyCookiePaths(response: NextResponse, cookieName: string, domain?: string) {
  const legacyPaths = ['/', '/api', '/api/v1', '/api/v1/auth']

  for (const path of legacyPaths) {
    response.cookies.set({
      name: cookieName,
      value: '',
      path,
      domain,
      expires: new Date(0)
    })
  }
}

export function getSetCookieHeaders({ headers }: Response): string[] {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const single = headers.get('set-cookie')
  if (!single) {
    return []
  }

  return splitSetCookieHeader(single)
}

export function appendSetCookies(from: Response, to: NextResponse) {
  const setCookies = getSetCookieHeaders(from)

  for (const setCookieHeader of setCookies) {
    const parsed = parseSetCookie(setCookieHeader)

    if (!parsed) {
      continue
    }

    const path = typeof parsed.attributes.path === 'string' ? parsed.attributes.path : '/'
    const domain = typeof parsed.attributes.domain === 'string' ? parsed.attributes.domain : undefined
    const maxAge = typeof parsed.attributes['max-age'] === 'string' ? Number(parsed.attributes['max-age']) : undefined
    const expires = typeof parsed.attributes.expires === 'string' ? new Date(parsed.attributes.expires) : undefined
    const sameSiteRaw =
      typeof parsed.attributes.samesite === 'string' ? parsed.attributes.samesite.toLowerCase() : undefined

    if (parsed.name === 'refresh_token') {
      clearLegacyCookiePaths(to, parsed.name, domain)
    }

    to.cookies.set({
      name: parsed.name,
      value: parsed.value,
      httpOnly: parsed.attributes.httponly === true,
      secure: parsed.attributes.secure === true,
      sameSite: sameSiteRaw === 'strict' ? 'strict' : sameSiteRaw === 'none' ? 'none' : 'lax',
      path,
      domain,
      maxAge: Number.isFinite(maxAge) ? maxAge : undefined,
      expires: expires && !Number.isNaN(expires.getTime()) ? expires : undefined
    })
  }

  return to
}

export function mergeCookieHeader(existing: string | null, overrides: Record<string, string>) {
  const existingParsed = Object.fromEntries(
    (existing ?? '')
      .split(';')
      .map(cookie => cookie.trim())
      .filter(Boolean)
      .map(cookie => {
        const separatorIndex = cookie.indexOf('=')

        return [cookie.slice(0, separatorIndex).trim(), cookie.slice(separatorIndex + 1).trim()] as [string, string]
      })
  )

  const merged = { ...existingParsed, ...overrides }

  return Object.entries(merged)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}
