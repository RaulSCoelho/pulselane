import { EmailDeliveryExecutorService } from '@/modules/email/email-delivery-executor.service'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import type { Job } from 'bullmq'

import type { SendEmailJobPayload } from '../jobs/send-email.job'
import { SEND_EMAIL_JOB, EMAIL_DELIVERY_QUEUE } from '../queue.constants'

@Injectable()
@Processor(EMAIL_DELIVERY_QUEUE)
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailDeliveryExecutorService: EmailDeliveryExecutorService) {
    super()
  }

  async process(job: Job<SendEmailJobPayload, void, string>): Promise<void> {
    if (job.name !== SEND_EMAIL_JOB) {
      throw new Error(`Unsupported job name: ${job.name}`)
    }

    await this.emailDeliveryExecutorService.processQueuedDelivery(job.data.deliveryId)
  }
}
