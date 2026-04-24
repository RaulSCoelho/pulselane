import type { RequestSnapshotMetadata, RequestSnapshotStaleReason } from '@/lib/http/request-snapshot/shared'

export type ResilientUnavailableReason =
  | 'rate_limited_no_snapshot'
  | 'server_error_no_snapshot'
  | 'network_error_no_snapshot'
  | 'http_error_no_snapshot'

export type ResilientGetResult<T> =
  | {
      status: 'fresh'
      data: T
    }
  | {
      status: 'stale'
      data: T
      reason: RequestSnapshotStaleReason
      snapshot: RequestSnapshotMetadata
    }
  | {
      status: 'bad_request'
      statusCode: 400
    }
  | {
      status: 'not_found'
      statusCode: 404
    }
  | {
      status: 'unauthorized'
      statusCode: 401
    }
  | {
      status: 'forbidden'
      statusCode: 403
    }
  | {
      status: 'unavailable'
      reason: ResilientUnavailableReason
      statusCode?: number
    }

export function resilientResultHasData<T>(
  result: ResilientGetResult<T>
): result is Extract<ResilientGetResult<T>, { status: 'fresh' | 'stale' }> {
  return result.status === 'fresh' || result.status === 'stale'
}
