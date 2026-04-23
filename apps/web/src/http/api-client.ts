import { refreshAuthSession } from '@/lib/auth/auth-refresh'
import { getApiBaseUrl } from '@/lib/http/api-base-url'
import { setForwardedHeaders } from '@/lib/http/forwarded-headers'
import { setOrganizationHeaders } from '@/lib/http/organization-headers'
import { persistRequestSnapshotOnServer } from '@/lib/http/request-snapshot/persist'
import { writeRequestSnapshot } from '@/lib/http/request-snapshot/server'
import { REQUEST_SNAPSHOT_ENDPOINT } from '@/lib/http/request-snapshot/shared'
import { setSessionHeaders } from '@/lib/http/session-headers'
import ky, { KyResponse, type Options } from 'ky'
import type { NextResponse } from 'next/server'

export type ApiOptions = Options & {
  saveSnapshot?: boolean
  snapshotTarget?: NextResponse
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

  if (snapshotTarget && typeof window === 'undefined') {
    await writeRequestSnapshot(snapshotTarget, request.url, payload, method)
    return
  }

  if (typeof window !== 'undefined') {
    await persistRequestSnapshotOnServer({
      requestUrl: request.url,
      method,
      payload
    })
  }
}

const sharedOptions = {
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        await setSessionHeaders(request)
        await setOrganizationHeaders(request)
        await setForwardedHeaders(request)
      }
    ]
  }
} satisfies Options

const externalApiOptions = {
  ...sharedOptions,
  retry: {
    limit: 1
  },
  hooks: {
    ...sharedOptions.hooks,
    afterResponse: [
      async ({ request, response, options }) => {
        const typedOptions = options as ApiOptions

        if (!request.url.includes(REQUEST_SNAPSHOT_ENDPOINT)) {
          await maybePersistSnapshot(request, response, typedOptions.saveSnapshot, typedOptions.snapshotTarget)
        }

        if (typeof window === 'undefined') {
          return response
        }

        if (response.status !== 401 || request.url.endsWith('/auth/refresh')) {
          return response
        }

        if (!(await refreshAuthSession())) {
          return response
        }

        return ky.retry()
      }
    ]
  }
} satisfies Options

const internalApiOptions = {
  ...sharedOptions,
  retry: 0,
  hooks: {
    ...sharedOptions.hooks,
    afterResponse: [
      async ({ request, response, options }) => {
        const typedOptions = options as ApiOptions

        if (!request.url.includes(REQUEST_SNAPSHOT_ENDPOINT)) {
          await maybePersistSnapshot(request, response, typedOptions.saveSnapshot, typedOptions.snapshotTarget)
        }

        return response
      }
    ]
  }
} satisfies Options

const externalApiClient = ky.create({
  baseUrl: `${getApiBaseUrl()}/`,
  ...externalApiOptions
})

const internalApiClient = ky.create({
  ...internalApiOptions
})

export async function api<T>(path: string, init?: ApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  return externalApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}

export async function nextApi<T>(path: string, init?: ApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return internalApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}
