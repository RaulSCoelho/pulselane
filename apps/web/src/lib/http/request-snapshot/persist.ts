import { resolveAppUrl } from '@/lib/http/app-url'

import { REQUEST_SNAPSHOT_ENDPOINT, type RequestSnapshotScope } from './shared'

type PersistRequestSnapshotPayload = {
  requestUrl: string
  method: string
  payload: unknown
  maxAgeSeconds?: number
  scope?: RequestSnapshotScope
  tags?: string[]
}

export async function persistRequestSnapshotOnServer({
  requestUrl,
  method,
  payload,
  maxAgeSeconds,
  scope,
  tags
}: PersistRequestSnapshotPayload) {
  await fetch(await resolveAppUrl(REQUEST_SNAPSHOT_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestUrl,
      method,
      payload,
      maxAgeSeconds,
      scope,
      tags
    })
  })
}
