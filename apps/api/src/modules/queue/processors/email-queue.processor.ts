import { EmailDeliveryExecutorService } from '@/modules/email/email-delivery-executor.service'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import type { Job, WorkerOptions } from 'bullmq'

import type { SendEmailJobPayload } from '../jobs/send-email.job'
import { EMAIL_DELIVERY_QUEUE, SEND_EMAIL_JOB } from '../queue.constants'

function buildEmailQueueWorkerOptionsFromEnv(): Partial<WorkerOptions> {
  const drainDelay = Number(process.env.EMAIL_QUEUE_DRAIN_DELAY_MS ?? 30_000)
  const stalledInterval = Number(process.env.EMAIL_QUEUE_STALLED_INTERVAL_MS ?? 120_000)

  return {
    drainDelay,
    stalledInterval
  }
}

@Injectable()
@Processor(EMAIL_DELIVERY_QUEUE, buildEmailQueueWorkerOptionsFromEnv())
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
