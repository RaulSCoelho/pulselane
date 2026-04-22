import { resolveAppUrl } from '@/lib/http/app-url'

import { REQUEST_SNAPSHOT_ENDPOINT } from './shared'

type PersistRequestSnapshotPayload = {
  requestUrl: string
  method: string
  payload: unknown
}

export async function persistRequestSnapshotOnServer({ requestUrl, method, payload }: PersistRequestSnapshotPayload) {
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
      payload
    })
  })
}
