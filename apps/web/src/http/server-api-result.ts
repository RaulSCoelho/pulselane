export type ServerApiUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'http_error'

export type ServerGetResult<T> =
  | {
      status: 'ok'
      data: T
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
      reason: ServerApiUnavailableReason
      statusCode?: number
    }

export function serverGetResultHasData<T>(
  result: ServerGetResult<T>
): result is Extract<ServerGetResult<T>, { status: 'ok' }> {
  return result.status === 'ok'
}
