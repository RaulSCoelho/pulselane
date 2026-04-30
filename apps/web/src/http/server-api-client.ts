import 'server-only'

import { getUserIdFromAccessToken } from '@/lib/auth/auth-token'
import { getServerApiUrl } from '@/lib/env'
import { setForwardedHeaders } from '@/lib/http/forwarded-headers'
import { setOrganizationHeaders } from '@/lib/http/organization-headers'
import { setSessionHeaders } from '@/lib/http/session-headers'
import { ACTIVE_ORGANIZATION_HEADER_NAME } from '@/lib/organizations/organization-context-constants'
import ky, { type KyResponse, type Options } from 'ky'
import { unstable_cache } from 'next/cache'
import type { z } from 'zod'

import type { ServerGetResult } from './server-api-result'

type CachedServerApiGetOptions<T> = {
  path: string
  schema: z.ZodType<T>
  tags?: string[]
  revalidate?: number | false
  request?: Omit<RequestInit, 'body' | 'method'>
  keyParts?: string[]
}

const safeFetch: typeof fetch = async (input, init) => {
  if (input instanceof Request) {
    const body = input.bodyUsed || !input.body ? undefined : await input.arrayBuffer()

    return fetch(input.url, {
      method: input.method,
      headers: input.headers,
      signal: input.signal,
      body: body ?? undefined,
      ...init
    })
  }

  return fetch(input, init)
}

const serverApiClient = ky.create({
  prefix: `${getServerApiUrl()}/`,
  fetch: safeFetch,
  throwHttpErrors: false,
  retry: 0,
  hooks: {
    beforeRequest: [
      async state => {
        const { request } = state

        await setSessionHeaders(request)
        await setOrganizationHeaders(request)
        await setForwardedHeaders(request)
      }
    ]
  }
})

const serverNextApiClient = ky.create({
  fetch: safeFetch,
  throwHttpErrors: false,
  retry: 0,
  hooks: {
    beforeRequest: [
      async state => {
        const { request } = state

        await setSessionHeaders(request)
        await setOrganizationHeaders(request)
        await setForwardedHeaders(request)
      }
    ]
  }
})

export async function serverApi<T>(path: string, init?: Options): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  return serverApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}

export async function serverNextApi<T>(path: string, init?: Options): Promise<KyResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return serverNextApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}

export async function cachedServerApiGet<T>({
  path,
  schema,
  tags = [],
  revalidate = 120,
  request,
  keyParts = []
}: CachedServerApiGetOptions<T>): Promise<ServerGetResult<T>> {
  const url = buildServerApiUrl(path)
  const headers = await buildServerApiHeaders(request?.headers)
  const cacheKeyParts = ['server-api', path, ...buildScopeCacheKeyParts(headers), ...keyParts]
  const getCachedData = unstable_cache(
    async () => {
      const response = await fetch(url, {
        ...request,
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new ServerApiStatusError(response.status)
      }

      return schema.parse(await response.json())
    },
    cacheKeyParts,
    {
      tags,
      revalidate
    }
  )

  try {
    return {
      status: 'ok',
      data: await getCachedData()
    }
  } catch (error) {
    if (error instanceof ServerApiStatusError) {
      return serverApiStatusToResult(error.statusCode)
    }

    if (error instanceof TypeError) {
      return {
        status: 'unavailable',
        reason: 'network_error'
      }
    }

    throw error
  }
}

async function buildServerApiHeaders(headersInit: HeadersInit | undefined) {
  const request = new Request('http://localhost', {
    headers: headersInit
  })

  await setSessionHeaders(request)
  await setOrganizationHeaders(request)
  await setForwardedHeaders(request)

  return request.headers
}

function buildServerApiUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, '')
  return `${getServerApiUrl()}/${normalizedPath}`
}

function buildScopeCacheKeyParts(headers: Headers) {
  const token = getBearerToken(headers)
  const userId = token ? getUserIdFromAccessToken(token) : null
  const organizationId = headers.get(ACTIVE_ORGANIZATION_HEADER_NAME)

  return [`user:${userId ?? 'anonymous'}`, `organization:${organizationId ?? 'none'}`]
}

function getBearerToken(headers: Headers) {
  const authorization = headers.get('authorization')

  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')

  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

class ServerApiStatusError extends Error {
  constructor(readonly statusCode: number) {
    super(`Server API request failed with status ${statusCode}`)
    this.name = 'ServerApiStatusError'
  }
}

function serverApiStatusToResult<T>(statusCode: number): ServerGetResult<T> {
  if (statusCode === 400) {
    return { status: 'bad_request', statusCode }
  }

  if (statusCode === 401) {
    return { status: 'unauthorized', statusCode }
  }

  if (statusCode === 403) {
    return { status: 'forbidden', statusCode }
  }

  if (statusCode === 404) {
    return { status: 'not_found', statusCode }
  }

  if (statusCode === 429) {
    return { status: 'unavailable', reason: 'rate_limited', statusCode }
  }

  if (statusCode >= 500) {
    return { status: 'unavailable', reason: 'server_error', statusCode }
  }

  return { status: 'unavailable', reason: 'http_error', statusCode }
}
