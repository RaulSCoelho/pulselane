import { Inject, Injectable } from '@nestjs/common'
import type { Queue } from 'bullmq'

import type { SendEmailJobPayload } from './jobs/send-email.job'
import { EMAIL_DELIVERY_QUEUE_TOKEN, SEND_EMAIL_JOB } from './queue.constants'

@Injectable()
export class EmailQueueService {
  constructor(
    @Inject(EMAIL_DELIVERY_QUEUE_TOKEN)
    private readonly emailQueue: Queue<SendEmailJobPayload, void, typeof SEND_EMAIL_JOB> | null
  ) {}

  isEnabled(): boolean {
    return this.emailQueue !== null
  }

  async enqueueSendEmail(payload: SendEmailJobPayload): Promise<void> {
    if (!this.emailQueue) {
      throw new Error('Email queue is not enabled')
    }

    await this.emailQueue.add(SEND_EMAIL_JOB, payload, {
      jobId: payload.deliveryId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 1000,
      removeOnFail: 5000
    })
  }
}
