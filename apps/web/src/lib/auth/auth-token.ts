import { decodeJwt } from 'jose'
import type { NextResponse } from 'next/server'

import { ACCESS_TOKEN_COOKIE_NAME } from './auth-constants'

export function getTokenExpiry(accessToken: string, bufferInSeconds = 60) {
  try {
    const { exp } = decodeJwt(accessToken)
    if (!exp) return null

    return {
      expiresAt: new Date(exp * 1000),
      expiresAtWithBuffer: new Date(exp * 1000 - bufferInSeconds * 1000)
    }
  } catch {
    return null
  }
}

export function isAccessTokenExpired(accessToken: string, bufferInSeconds = 60): boolean {
  try {
    const expiry = getTokenExpiry(accessToken, bufferInSeconds)
    if (!expiry) return true
    return Date.now() >= expiry.expiresAtWithBuffer.getTime()
  } catch {
    return true
  }
}

export function setAccessTokenCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 10 // 10 years
  })
  return response
}

export function clearAccessTokenCookie(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
    maxAge: 0
  })

  return response
}
