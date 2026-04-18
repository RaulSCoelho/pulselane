import request from 'supertest'
import { expect, it } from 'vitest'

import { signupUser } from '../../support/factories/auth.factory'
import { getPrometheusMetricValue } from '../../support/http/prometheus'
import { getTestContext } from '../../support/runtime/test-context'

function getMetricsAuthorizationHeader() {
  return `Bearer ${process.env.METRICS_BEARER_TOKEN}`
}

export function registerFailedLoginMetricsCase(): void {
  it('should increment failed login metric when credentials are invalid', async () => {
    const { app } = await getTestContext()

    await signupUser(app, {
      name: 'Metrics Login User',
      email: 'metrics-login-user@example.com',
      password: '123456',
      organizationName: 'Metrics Login Workspace'
    })

    const beforeMetricsResponse = await request(app.getHttpServer())
      .get('/metrics')
      .set('authorization', getMetricsAuthorizationHeader())
      .expect(200)

    const beforeCount = getPrometheusMetricValue(beforeMetricsResponse.text, 'pulselane_api_auth_failed_logins_total', {
      reason: 'invalid_credentials'
    })

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'metrics-login-user@example.com',
        password: 'wrong-password'
      })
      .expect(401)

    const afterMetricsResponse = await request(app.getHttpServer())
      .get('/metrics')
      .set('authorization', getMetricsAuthorizationHeader())
      .expect(200)

    const afterCount = getPrometheusMetricValue(afterMetricsResponse.text, 'pulselane_api_auth_failed_logins_total', {
      reason: 'invalid_credentials'
    })

    expect(afterCount).toBe(beforeCount + 1)
  })
}
