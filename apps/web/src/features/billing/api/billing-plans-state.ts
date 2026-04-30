import type { BillingPlansResponse } from '@pulselane/contracts/billing'

import type { ServerGetResult } from '../../../http/server-api-result'

export type BillingPlansUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type BillingPlansState =
  | {
      status: 'ready'
      data: BillingPlansResponse
    }
  | {
      status: 'temporarily_unavailable'
      reason: BillingPlansUnavailableReason
    }

export function billingPlansResultToState(result: ServerGetResult<BillingPlansResponse>): BillingPlansState {
  if (result.status === 'ok') {
    return {
      status: 'ready',
      data: result.data
    }
  }

  if (result.status === 'unavailable') {
    return {
      status: 'temporarily_unavailable',
      reason: billingPlansUnavailableReason(result.reason)
    }
  }

  return {
    status: 'temporarily_unavailable',
    reason: 'unexpected_response'
  }
}

function billingPlansUnavailableReason(
  reason: Extract<ServerGetResult<BillingPlansResponse>, { status: 'unavailable' }>['reason']
): BillingPlansUnavailableReason {
  if (reason === 'rate_limited') {
    return 'rate_limited'
  }

  if (reason === 'server_error') {
    return 'server_error'
  }

  if (reason === 'network_error') {
    return 'network_error'
  }

  return 'unexpected_response'
}
