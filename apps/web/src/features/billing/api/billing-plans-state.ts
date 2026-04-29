import type { BillingPlansResponse } from '@pulselane/contracts/billing'

import type { ResilientGetResult } from '../../../http/api-result'

export type BillingPlansUnavailableReason = 'rate_limited' | 'server_error' | 'network_error' | 'unexpected_response'

export type BillingPlansState =
  | {
      status: 'ready'
      data: BillingPlansResponse
      freshness: 'fresh' | 'stale'
    }
  | {
      status: 'temporarily_unavailable'
      reason: BillingPlansUnavailableReason
    }

export function billingPlansResultToState(result: ResilientGetResult<BillingPlansResponse>): BillingPlansState {
  if (result.status === 'fresh') {
    return {
      status: 'ready',
      data: result.data,
      freshness: 'fresh'
    }
  }

  if (result.status === 'stale') {
    return {
      status: 'ready',
      data: result.data,
      freshness: 'stale'
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
  reason: Extract<ResilientGetResult<BillingPlansResponse>, { status: 'unavailable' }>['reason']
): BillingPlansUnavailableReason {
  if (reason === 'rate_limited_no_snapshot') {
    return 'rate_limited'
  }

  if (reason === 'server_error_no_snapshot') {
    return 'server_error'
  }

  if (reason === 'network_error_no_snapshot') {
    return 'network_error'
  }

  return 'unexpected_response'
}
