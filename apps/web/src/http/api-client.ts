import { refreshAuthCookieSession } from '@/lib/auth/auth-refresh'
import { getApiBaseUrl } from '@/lib/http/api-base-url'
import { setForwardedHeaders } from '@/lib/http/forwarded-headers'
import { setSessionHeaders } from '@/lib/http/session-headers'
import ky, { KyResponse, type Options } from 'ky'

const defaultOptions = {
  retry: 0,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        await setSessionHeaders(request)
        await setForwardedHeaders(request)
      }
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (typeof window === 'undefined') {
          return response
        }

        if (response.status !== 401 || request.url.endsWith('/auth/refresh')) {
          return response
        }

        if (!(await refreshAuthCookieSession())) {
          return response
        }

        return ky.retry({ request: new Request(request) })
      }
    ]
  }
} satisfies Options

const externalApiClient = ky.create({
  baseUrl: `${getApiBaseUrl()}/`,
  ...defaultOptions
})

const internalApiClient = ky.create({
  ...defaultOptions
})

export async function api<T>(path: string, init?: Options): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  return externalApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}

export async function nextApi<T>(path: string, init?: Options): Promise<KyResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return internalApiClient(normalizedPath, {
    credentials: 'include',
    cache: 'no-store',
    ...init
  })
}
