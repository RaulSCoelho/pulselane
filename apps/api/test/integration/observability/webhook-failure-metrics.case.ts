import request from 'supertest'
import { expect, it } from 'vitest'

import { getPrometheusMetricValue } from '../../support/http/prometheus'
import { getTestContext } from '../../support/runtime/test-context'

export function registerWebhookFailureMetricsCase(): void {
  it('should increment webhook failure metric when stripe signature header is missing', async () => {
    const { app } = await getTestContext()

    const beforeMetricsResponse = await request(app.getHttpServer()).get('/metrics').expect(200)

    const beforeCount = getPrometheusMetricValue(
      beforeMetricsResponse.text,
      'pulselane_api_billing_webhook_failures_total',
      {
        provider: 'stripe',
        event_type: 'missing_signature'
      }
    )

    await request(app.getHttpServer())
      .post('/api/billing/webhooks/stripe')
      .set('content-type', 'application/json')
      .send({ id: 'evt_test_missing_signature' })
      .expect(400)

    const afterMetricsResponse = await request(app.getHttpServer()).get('/metrics').expect(200)

    const afterCount = getPrometheusMetricValue(
      afterMetricsResponse.text,
      'pulselane_api_billing_webhook_failures_total',
      {
        provider: 'stripe',
        event_type: 'missing_signature'
      }
    )

    expect(afterCount).toBe(beforeCount + 1)
  })
}
