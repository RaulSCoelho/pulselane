'use client'

import { getClientApiUrl } from '@/lib/env'
import { setOrganizationHeaders } from '@/lib/http/organization-headers'
import { setSessionHeaders } from '@/lib/http/session-headers'
import ky, { type KyResponse, type Options } from 'ky'

export type ClientApiOptions = Options

async function refreshAuthSession() {
  const response = await ky.post('/api/v1/auth/refresh', {
    credentials: 'include',
    throwHttpErrors: false,
    retry: 0
  })

  return response.ok
}

const clientApiClient = ky.create({
  prefix: `${getClientApiUrl()}/`,
  credentials: 'include',
  throwHttpErrors: false,
  retry: 0,
  hooks: {
    beforeRequest: [
      async state => {
        const { request } = state

        await setSessionHeaders(request)
        await setOrganizationHeaders(request)
      }
    ],
    afterResponse: [
      async state => {
        const { request, response } = state

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
})

const nextClientApiClient = ky.create({
  credentials: 'include',
  throwHttpErrors: false,
  retry: 0
})

export async function clientApi<T>(path: string, init?: ClientApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.replace(/^\/+/, '')

  return clientApiClient(normalizedPath, init)
}

export async function nextClientApi<T>(path: string, init?: ClientApiOptions): Promise<KyResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return nextClientApiClient(normalizedPath, init)
}
