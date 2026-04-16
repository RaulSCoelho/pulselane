import { describe } from 'vitest'

import { registerFailedLoginMetricsCase } from './failed-login-metrics.case'
import { registerMetricsEndpointCase } from './metrics-endpoint.case'
import { registerWebhookFailureMetricsCase } from './webhook-failure-metrics.case'

describe('Observability integration', () => {
  registerMetricsEndpointCase()
  registerFailedLoginMetricsCase()
  registerWebhookFailureMetricsCase()
})
