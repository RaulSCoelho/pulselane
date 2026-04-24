'use client'

import { getClientApiUrl } from '@/lib/env'
import { readActiveOrganizationIdFromDocument } from '@/lib/organizations/organization-context'
import { ACTIVE_ORGANIZATION_HEADER_NAME } from '@/lib/organizations/organization-context-constants'
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
      state => {
        const { request } = state

        if (request.headers.has(ACTIVE_ORGANIZATION_HEADER_NAME)) {
          return
        }

        const activeOrganizationId = readActiveOrganizationIdFromDocument()

        if (activeOrganizationId) {
          request.headers.set(ACTIVE_ORGANIZATION_HEADER_NAME, activeOrganizationId)
        }
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
