import 'server-only'

import { getServerApiUrl } from '@/lib/env'
import { setForwardedHeaders } from '@/lib/http/forwarded-headers'
import { setOrganizationHeaders } from '@/lib/http/organization-headers'
import { persistRequestSnapshotOnServer } from '@/lib/http/request-snapshot/persist'
import { resolveRequestSnapshotScope, writeRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { REQUEST_SNAPSHOT_ENDPOINT, type RequestSnapshotScope } from '@/lib/http/request-snapshot/shared'
import { setSessionHeaders } from '@/lib/http/session-headers'
import ky, { type KyResponse, type Options } from 'ky'
import type { NextResponse } from 'next/server'

export type ServerApiOptions = Options & {
  saveSnapshot?: boolean
  snapshotTarget?: NextResponse
  snapshotMaxAgeSeconds?: number
  snapshotScope?: RequestSnapshotScope
  snapshotTags?: string[]
  snapshotTenantScoped?: boolean
  snapshotUserScoped?: boolean
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

async function maybePersistSnapshot(request: Request, response: Response, options: ServerApiOptions) {
  if (!options.saveSnapshot || !response.ok) {
    return
  }

  const method = request.method.toUpperCase()

  if (method !== 'GET') {
    return
  }

  const payload = await response
    .clone()
    .json()
    .catch(() => null)

  if (payload === null) {
    return
  }

  const scope = await resolveRequestSnapshotScope({
    request,
    scope: options.snapshotScope,
    tenantScoped: options.snapshotTenantScoped,
    userScoped: options.snapshotUserScoped
  })

  if (options.snapshotTarget) {
    await writeRequestSnapshot(options.snapshotTarget, request.url, payload, {
      method,
      maxAgeSeconds: options.snapshotMaxAgeSeconds,
      scope,
      tags: options.snapshotTags,
      tenantScoped: options.snapshotTenantScoped,
      userScoped: options.snapshotUserScoped
    })
    return
  }

  await persistRequestSnapshotOnServer({
    requestUrl: request.url,
    method,
    payload,
    maxAgeSeconds: options.snapshotMaxAgeSeconds,
    scope,
    tags: options.snapshotTags
  })
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
    ],
    afterResponse: [
      async state => {
        const { request, response, options } = state
        const typedOptions = options as ServerApiOptions

        if (!request.url.includes(REQUEST_SNAPSHOT_ENDPOINT)) {
          await maybePersistSnapshot(request, response, typedOptions).catch(() => undefined)
        }

        return response
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

export async function serverApi<T>(path: string, init?: ServerApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  return serverApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}

export async function serverNextApi<T>(path: string, init?: ServerApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return serverNextApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}
