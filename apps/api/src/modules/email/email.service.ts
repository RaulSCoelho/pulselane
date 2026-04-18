import { EnvConfig } from '@/config/env.config'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EmailDeliveryStatus, Prisma } from '@prisma/client'

import { EmailQueueService } from '../queue/email-queue.service'
import { SendEmailInput } from './contracts/send-email.input'
import { ListEmailDeliveriesQueryDto } from './dto/requests/list-email-deliveries-query.dto'
import { EmailDeliveryExecutorService } from './email-delivery-executor.service'
import { EmailRepository } from './email.repository'

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly emailRepository: EmailRepository,
    private readonly emailQueueService: EmailQueueService,
    private readonly emailDeliveryExecutorService: EmailDeliveryExecutorService
  ) {}

  private get env() {
    return {
      transport: this.configService.get('emailTransport', { infer: true })
    }
  }

  async send(input: SendEmailInput, tx?: Prisma.TransactionClient) {
    const transport = this.env.transport

    const delivery = await this.emailRepository.create(
      {
        organizationId: input.organizationId,
        sentBy: input.sentBy ?? null,
        to: input.to,
        subject: input.subject,
        transport,
        status: EmailDeliveryStatus.pending,
        metadata: {
          ...(typeof input.metadata === 'object' && input.metadata !== null && !Array.isArray(input.metadata)
            ? input.metadata
            : {}),
          text: input.text,
          html: input.html
        }
      },
      tx
    )

    try {
      if (this.emailQueueService.isEnabled()) {
        await this.emailQueueService.enqueueSendEmail({
          deliveryId: delivery.id
        })

        return delivery
      }

      await this.emailDeliveryExecutorService.processQueuedDelivery(delivery.id)

      const processedDelivery = await this.emailRepository.findById(delivery.id, tx)

      if (!processedDelivery) {
        throw new Error('Email delivery not found after direct processing')
      }

      return processedDelivery
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected email delivery error'

      return this.emailRepository.markFailed(delivery.id, `Failed to send email delivery: ${message}`, tx)
    }
  }

  async findAll(organizationId: string, query: ListEmailDeliveriesQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    const result = await this.emailRepository.findMany(
      {
        organizationId,
        cursor: query.cursor,
        limit,
        to: query.to,
        status: query.status
      },
      tx
    )

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor
      }
    }
  }
}
