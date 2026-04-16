import { Injectable } from '@nestjs/common'
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client'

type HttpMetricLabels = 'method' | 'route' | 'status_code'
type FailedLoginLabels = 'reason'
type WebhookFailureLabels = 'provider' | 'event_type'
type BillingSyncFailureLabels = 'provider' | 'operation'

@Injectable()
export class MetricsService {
  private readonly registry: Registry
  private readonly httpRequestsTotal: Counter<HttpMetricLabels>
  private readonly httpRequestErrorsTotal: Counter<HttpMetricLabels>
  private readonly httpRequestDurationSeconds: Histogram<HttpMetricLabels>
  private readonly authFailedLoginsTotal: Counter<FailedLoginLabels>
  private readonly billingWebhookFailuresTotal: Counter<WebhookFailureLabels>
  private readonly billingSyncFailuresTotal: Counter<BillingSyncFailureLabels>

  constructor() {
    this.registry = new Registry()

    this.registry.setDefaultLabels({
      service: 'api',
      app: 'pulselane'
    })

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'pulselane_api_process_'
    })

    this.httpRequestsTotal = new Counter({
      name: 'pulselane_api_http_requests_total',
      help: 'Total HTTP requests processed by the API',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    })

    this.httpRequestErrorsTotal = new Counter({
      name: 'pulselane_api_http_request_errors_total',
      help: 'Total HTTP requests that finished with status code >= 400',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    })

    this.httpRequestDurationSeconds = new Histogram({
      name: 'pulselane_api_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry]
    })

    this.authFailedLoginsTotal = new Counter({
      name: 'pulselane_api_auth_failed_logins_total',
      help: 'Total failed login attempts',
      labelNames: ['reason'],
      registers: [this.registry]
    })

    this.billingWebhookFailuresTotal = new Counter({
      name: 'pulselane_api_billing_webhook_failures_total',
      help: 'Total billing webhook failures',
      labelNames: ['provider', 'event_type'],
      registers: [this.registry]
    })

    this.billingSyncFailuresTotal = new Counter({
      name: 'pulselane_api_billing_sync_failures_total',
      help: 'Total billing synchronization failures',
      labelNames: ['provider', 'operation'],
      registers: [this.registry]
    })
  }

  getContentType() {
    return this.registry.contentType
  }

  async getMetrics() {
    return this.registry.metrics()
  }

  recordHttpRequest(params: { method: string; route: string; statusCode: number; durationSeconds: number }) {
    const labels = {
      method: this.normalizeMethod(params.method),
      route: this.normalizeRoute(params.route),
      status_code: String(params.statusCode)
    } satisfies Record<HttpMetricLabels, string>

    this.httpRequestsTotal.inc(labels)
    this.httpRequestDurationSeconds.observe(labels, params.durationSeconds)

    if (params.statusCode >= 400) {
      this.httpRequestErrorsTotal.inc(labels)
    }
  }

  recordFailedLogin(reason: string) {
    this.authFailedLoginsTotal.inc({
      reason: reason.trim().length > 0 ? reason : 'unknown'
    })
  }

  recordWebhookFailure(params: { provider: string; eventType?: string }) {
    this.billingWebhookFailuresTotal.inc({
      provider: this.normalizeValue(params.provider),
      event_type: this.normalizeValue(params.eventType)
    })
  }

  recordBillingSyncFailure(params: { provider: string; operation?: string }) {
    this.billingSyncFailuresTotal.inc({
      provider: this.normalizeValue(params.provider),
      operation: this.normalizeValue(params.operation)
    })
  }

  private normalizeMethod(method: string) {
    return method.trim().toUpperCase()
  }

  private normalizeRoute(route: string) {
    const normalizedRoute = route.split('?')[0].trim()

    return normalizedRoute.length > 0 ? normalizedRoute : 'unknown_route'
  }

  private normalizeValue(value?: string) {
    if (!value) {
      return 'unknown'
    }

    const normalized = value.trim()

    return normalized.length > 0 ? normalized : 'unknown'
  }
}
