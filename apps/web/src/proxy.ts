import { AUTH_COOKIE_NAME, PROTECTED_PATH_PREFIXES } from '@/lib/auth/auth-constants'
import { buildLoginRedirectPath } from '@/lib/auth/auth-redirect'
import { NextResponse, type NextRequest } from 'next/server'

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(prefix => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (authCookie) {
    return NextResponse.next()
  }

  const redirectTo = `${pathname}${request.nextUrl.search}`
  const loginPath = buildLoginRedirectPath(redirectTo)

  return NextResponse.redirect(new URL(loginPath, request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
