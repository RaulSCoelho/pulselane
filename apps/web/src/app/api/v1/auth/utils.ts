import { NextRequest, NextResponse } from 'next/server'

export async function parseRequestJson<T>(request: NextRequest, parse: (value: unknown) => T): Promise<T> {
  const json = await request.json()
  return parse(json)
}

export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 400 })
}

export async function proxyErrorResponse(backendResponse: Response): Promise<NextResponse> {
  const bodyText = await backendResponse.text()
  return new NextResponse(bodyText || null, {
    status: backendResponse.status
  })
}
