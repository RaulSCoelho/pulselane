import { MetricsService } from '@/infra/observability/metrics.service'
import { StripeBillingService } from '@/modules/billing/stripe-billing.service'
import { BadRequestException } from '@nestjs/common'
import request from 'supertest'
import { afterEach, expect, it, vi } from 'vitest'

import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type StripeWebhookAckResponse = {
  received: boolean
}

type TestStripeWebhookEvent = {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

export function registerBillingWebhookHttpCase(): void {
  it('should reject webhook requests without stripe signature header and record failure metric', async () => {
    const { app } = await getTestContext()

    const metricsService = app.get(MetricsService)
    const metricsSpy = vi.spyOn(metricsService, 'recordWebhookFailure')

    const response = await expectTyped<ErrorResponse>(
      request(app.getHttpServer())
        .post('/api/billing/webhooks/stripe')
        .set('content-type', 'application/json')
        .send(
          JSON.stringify({
            id: 'evt_missing_signature_http_test',
            type: 'customer.subscription.updated',
            data: {
              object: {}
            }
          } satisfies TestStripeWebhookEvent)
        ),
      400
    )

    expect(response.body.message).toBe('Missing Stripe signature header')
    expect(metricsSpy).toHaveBeenCalledWith({
      provider: 'stripe',
      eventType: 'missing_signature'
    })
  })

  it('should reject invalid webhook signatures through the HTTP endpoint and record failure metric', async () => {
    const { app } = await getTestContext()

    const stripeBillingService = app.get(StripeBillingService)
    const metricsService = app.get(MetricsService)

    const metricsSpy = vi.spyOn(metricsService, 'recordWebhookFailure')
    const constructWebhookEventSpy = vi.spyOn(stripeBillingService, 'constructWebhookEvent').mockImplementation(() => {
      throw new BadRequestException('Invalid Stripe webhook signature')
    })
    const processWebhookSpy = vi.spyOn(stripeBillingService, 'processWebhook')

    const payload = {
      id: 'evt_invalid_signature_http_test',
      type: 'customer.subscription.updated',
      data: {
        object: {}
      }
    } satisfies TestStripeWebhookEvent

    const response = await expectTyped<ErrorResponse>(
      request(app.getHttpServer())
        .post('/api/billing/webhooks/stripe')
        .set('stripe-signature', 't=1,v1=invalid')
        .set('content-type', 'application/json')
        .send(JSON.stringify(payload)),
      400
    )

    expect(response.body.message).toBe('Invalid Stripe webhook signature')
    expect(constructWebhookEventSpy).toHaveBeenCalledOnce()
    expect(processWebhookSpy).not.toHaveBeenCalled()
    expect(metricsSpy).toHaveBeenCalledWith({
      provider: 'stripe',
      eventType: 'unknown'
    })
  })

  it('should accept a valid webhook event through the HTTP endpoint and forward the parsed event to the service', async () => {
    const { app } = await getTestContext()

    const stripeBillingService = app.get(StripeBillingService)
    const metricsService = app.get(MetricsService)

    const payload = {
      id: 'evt_http_success_test',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_http_success_test'
        }
      }
    } satisfies TestStripeWebhookEvent

    const event = {
      id: payload.id,
      type: payload.type,
      data: payload.data
    } as never

    const metricsSpy = vi.spyOn(metricsService, 'recordWebhookFailure')
    const constructWebhookEventSpy = vi
      .spyOn(stripeBillingService, 'constructWebhookEvent')
      .mockImplementation((rawBody: Buffer, signature: string) => {
        expect(signature).toBe('t=1,v1=valid')
        expect(Buffer.isBuffer(rawBody)).toBe(true)
        expect(JSON.parse(rawBody.toString('utf8'))).toEqual(payload)

        return event
      })

    const processWebhookSpy = vi.spyOn(stripeBillingService, 'processWebhook').mockResolvedValue(undefined)

    const response = await expectTyped<StripeWebhookAckResponse>(
      request(app.getHttpServer())
        .post('/api/billing/webhooks/stripe')
        .set('stripe-signature', 't=1,v1=valid')
        .set('content-type', 'application/json')
        .send(JSON.stringify(payload)),
      200
    )

    expect(response.body).toEqual({
      received: true
    })
    expect(constructWebhookEventSpy).toHaveBeenCalledOnce()
    expect(processWebhookSpy).toHaveBeenCalledWith(event)
    expect(metricsSpy).not.toHaveBeenCalled()
  })
}
