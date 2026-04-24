import 'server-only'

import { getServerApiUrl } from '@/lib/env'
import { setForwardedHeaders } from '@/lib/http/forwarded-headers'
import { setOrganizationHeaders } from '@/lib/http/organization-headers'
import { persistRequestSnapshotOnServer } from '@/lib/http/request-snapshot/persist'
import { writeRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { REQUEST_SNAPSHOT_ENDPOINT } from '@/lib/http/request-snapshot/shared'
import { setSessionHeaders } from '@/lib/http/session-headers'
import ky, { type KyResponse, type Options } from 'ky'
import type { NextResponse } from 'next/server'

export type ServerApiOptions = Options & {
  saveSnapshot?: boolean
  snapshotTarget?: NextResponse
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

async function maybePersistSnapshot(
  request: Request,
  response: Response,
  saveSnapshot: boolean | undefined,
  snapshotTarget: NextResponse | undefined
) {
  if (!saveSnapshot || !response.ok) {
    return
  }

  const method = request.method.toUpperCase()

  if (method !== 'GET') {
    return
  }

  const clonedResponse = response.clone()
  const payload = await clonedResponse.json()

  if (snapshotTarget) {
    await writeRequestSnapshot(snapshotTarget, request.url, payload, method)
    return
  }

  await persistRequestSnapshotOnServer({
    requestUrl: request.url,
    method,
    payload
  })
}

const serverApiClient = ky.create({
  prefix: `${getServerApiUrl()}/`,
  fetch: safeFetch,
  throwHttpErrors: false,
  retry: {
    limit: 1
  },
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
          await maybePersistSnapshot(request, response, typedOptions.saveSnapshot, typedOptions.snapshotTarget)
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
