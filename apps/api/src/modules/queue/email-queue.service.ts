import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import type { Queue } from 'bullmq'

import type { SendEmailJobPayload } from './jobs/send-email.job'
import { SEND_EMAIL_JOB, EMAIL_DELIVERY_QUEUE } from './queue.constants'

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue(EMAIL_DELIVERY_QUEUE)
    private readonly emailQueue: Queue<SendEmailJobPayload, void, typeof SEND_EMAIL_JOB>
  ) {}

  async enqueueSendEmail(payload: SendEmailJobPayload) {
    await this.emailQueue.add(SEND_EMAIL_JOB, payload, {
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
