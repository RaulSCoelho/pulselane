import { getServerAccessToken, setAccessTokenCookie } from '@/lib/auth/auth-cookies'
import { getApiBaseUrl } from '@/lib/http/api-base-url'
import { authResponseSchema } from '@pulselane/contracts/auth'
import ky, { KyResponse, type Options } from 'ky'

const serverApiClient = ky.create({
  baseUrl: `${getApiBaseUrl()}/`,
  retry: 0,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const accessToken = await getServerAccessToken()

        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      }
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status !== 401) {
          return response
        }

        const refreshedSession = await refreshServerSession()

        if (!refreshedSession) {
          return response
        }

        if (refreshedSession.accessToken) {
          request.headers.set('Authorization', `Bearer ${refreshedSession.accessToken}`)
        } else {
          request.headers.delete('Authorization')
        }

        return ky.retry({ request: new Request(request) })
      }
    ]
  }
})

export async function serverApiFetch<T>(path: string, init?: Options): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  const response = await serverApiClient(normalizedPath, {
    cache: 'no-store',
    credentials: 'include',
    ...init
  })

  return response
}

async function refreshServerSession() {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }

  const payload = authResponseSchema.parse(await response.json())

  setAccessTokenCookie(payload.accessToken, payload.expiresIn)

  return payload
}
