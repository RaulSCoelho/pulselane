import { decodeJwt, jwtVerify } from 'jose'
import type { NextResponse } from 'next/server'

import { ACCESS_TOKEN_COOKIE_NAME } from './auth-constants'

export function isAccessTokenExpired(accessToken: string, bufferInSeconds = 60): boolean {
  try {
    const { exp } = decodeJwt(accessToken)
    if (!exp) return true
    return Date.now() >= exp * 1000 - bufferInSeconds * 1000
  } catch {
    return true
  }
}

export async function verifyAccessToken(accessToken: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
    const { payload } = await jwtVerify(accessToken, secret)
    return payload
  } catch {
    return null
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
