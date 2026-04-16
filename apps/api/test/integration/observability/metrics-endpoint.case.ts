import request from 'supertest'
import { expect, it } from 'vitest'

import { getTestContext } from '../../support/runtime/test-context'

export function registerMetricsEndpointCase(): void {
  it('should expose prometheus metrics', async () => {
    const { app } = await getTestContext()

    await request(app.getHttpServer()).get('/health').expect(200)

    const response = await request(app.getHttpServer()).get('/metrics').expect(200)

    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.text).toContain('pulselane_api_http_requests_total')
    expect(response.text).toContain('pulselane_api_http_request_errors_total')
    expect(response.text).toContain('pulselane_api_http_request_duration_seconds')
    expect(response.text).toContain('pulselane_api_auth_failed_logins_total')
    expect(response.text).toContain('pulselane_api_billing_webhook_failures_total')
    expect(response.text).toContain('pulselane_api_billing_sync_failures_total')
  })
}
