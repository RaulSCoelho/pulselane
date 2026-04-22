export async function setForwardedHeaders(request: Request): Promise<void> {
  if (typeof window !== 'undefined') {
    return
  }

  const { headers } = await import('next/headers')
  const incoming = await headers()
  const outgoing = request.headers

  const userAgent = incoming.get('user-agent')
  const forwardedFor = incoming.get('x-forwarded-for')
  const forwardedProto = incoming.get('x-forwarded-proto')
  const forwardedHost = incoming.get('x-forwarded-host')

  if (userAgent) outgoing.set('user-agent', userAgent)
  if (forwardedFor) outgoing.set('x-forwarded-for', forwardedFor)
  if (forwardedProto) outgoing.set('x-forwarded-proto', forwardedProto)
  if (forwardedHost) outgoing.set('x-forwarded-host', forwardedHost)
}
