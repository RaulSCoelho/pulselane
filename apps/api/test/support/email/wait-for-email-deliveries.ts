/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { expect } from 'vitest'

import { withOrgAuth } from '../http/request-helpers'

type WaitForSentEmailDeliveriesInput = {
  app: NestFastifyApplication
  accessToken: string
  organizationId: string
  expectedCount: number
  to?: string
  timeout?: number
  interval?: number
}

export async function waitForSentEmailDeliveries({
  app,
  accessToken,
  organizationId,
  expectedCount,
  to,
  timeout = 5000,
  interval = 100
}: WaitForSentEmailDeliveriesInput): Promise<void> {
  await expect
    .poll(
      async () => {
        const response = await withOrgAuth(
          request(app.getHttpServer())
            .get('/api/email-deliveries')
            .query({
              limit: expectedCount,
              status: 'sent',
              ...(to ? { to } : {})
            }),
          {
            accessToken,
            organizationId
          }
        )

        return response.body.items?.length ?? 0
      },
      {
        timeout,
        interval
      }
    )
    .toBe(expectedCount)
}
