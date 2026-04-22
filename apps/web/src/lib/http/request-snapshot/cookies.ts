import { NextResponse } from 'next/server'

import { REQUEST_SNAPSHOT_COOKIE_NAME, REQUEST_SNAPSHOT_MAX_AGE_SECONDS } from './shared'

export function setRequestSnapshotsToResponse(response: NextResponse, encoded: string) {
  response.cookies.set(REQUEST_SNAPSHOT_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: REQUEST_SNAPSHOT_MAX_AGE_SECONDS
  })
}

export function clearRequestSnapshotsFromResponse(response: NextResponse) {
  response.cookies.set(REQUEST_SNAPSHOT_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
    maxAge: 0
  })
}
