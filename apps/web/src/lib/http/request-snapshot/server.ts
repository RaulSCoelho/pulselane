'use server'

import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { gunzipSync, gzipSync } from 'node:zlib'
import { z } from 'zod'

import { setRequestSnapshots } from './cookies'
import { REQUEST_SNAPSHOT_COOKIE_NAME, buildRequestSnapshotKey } from './shared'

const requestSnapshotStoreSchema = z.record(z.string(), z.unknown())

type RequestSnapshotStore = z.infer<typeof requestSnapshotStoreSchema>

function encodeSnapshotStore(store: RequestSnapshotStore): string {
  const json = JSON.stringify(store)
  const compressed = gzipSync(Buffer.from(json, 'utf8'))

  return compressed.toString('base64url')
}

function decodeSnapshotStore(rawValue: string): RequestSnapshotStore | null {
  try {
    const compressed = Buffer.from(rawValue, 'base64url')
    const json = gunzipSync(compressed).toString('utf8')

    return requestSnapshotStoreSchema.parse(JSON.parse(json))
  } catch {
    return null
  }
}

async function readSnapshotStore(): Promise<RequestSnapshotStore> {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(REQUEST_SNAPSHOT_COOKIE_NAME)?.value

  if (!rawValue) {
    return {}
  }

  return decodeSnapshotStore(rawValue) ?? {}
}

export async function readRequestSnapshot<T>(
  requestUrl: string,
  schema: z.ZodType<T>,
  method = 'GET'
): Promise<T | null> {
  const snapshotKey = buildRequestSnapshotKey(requestUrl, method)

  if (!snapshotKey) {
    return null
  }

  const store = await readSnapshotStore()
  const value = store[snapshotKey]

  if (typeof value === 'undefined') {
    return null
  }

  try {
    return schema.parse(value)
  } catch {
    return null
  }
}

export async function writeRequestSnapshot(
  response: NextResponse,
  requestUrl: string,
  value: unknown,
  method = 'GET'
): Promise<boolean> {
  const snapshotKey = buildRequestSnapshotKey(requestUrl, method)

  if (!snapshotKey) {
    return false
  }

  const currentStore = await readSnapshotStore()
  const nextStore: RequestSnapshotStore = {
    ...currentStore,
    [snapshotKey]: value
  }

  const encoded = encodeSnapshotStore(nextStore)

  setRequestSnapshots(response, encoded)

  return true
}
