import { EnvConfig } from '@/config/env.config'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EmailDeliveryStatus } from '@prisma/client'

import { type EmailProvider } from './contracts/email-provider'
import { EMAIL_PROVIDER } from './email.constants'
import { EmailRepository } from './email.repository'

@Injectable()
export class EmailDeliveryExecutorService {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
    private readonly emailRepository: EmailRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider
  ) {}

  private get env() {
    return {
      fromName: this.configService.get('emailFromName', { infer: true }),
      fromAddress: this.configService.get('emailFromAddress', { infer: true })
    }
  }

  async processQueuedDelivery(deliveryId: string) {
    const lockedDelivery = await this.prisma.$transaction(async tx => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${`email-delivery:${deliveryId}`}))
      `

      const currentDelivery = await this.emailRepository.findById(deliveryId, tx)

      if (!currentDelivery) {
        throw new NotFoundException('Email delivery not found')
      }

      if (currentDelivery.status === EmailDeliveryStatus.sent) {
        return currentDelivery
      }

      const processingDelivery = await this.emailRepository.markProcessing(deliveryId, tx)

      if (!processingDelivery) {
        throw new NotFoundException('Email delivery not found')
      }

      return processingDelivery
    })

    if (lockedDelivery.status === EmailDeliveryStatus.sent) {
      return lockedDelivery
    }

    const fromName = this.env.fromName
    const fromAddress = this.env.fromAddress

    try {
      const result = await this.emailProvider.send({
        fromName,
        fromAddress,
        to: lockedDelivery.to,
        subject: lockedDelivery.subject,
        text: this.extractRequiredText(lockedDelivery.metadata),
        html: this.extractRequiredHtml(lockedDelivery.metadata)
      })

      return this.emailRepository.markSent(deliveryId, {
        ...(this.asMetadataObject(lockedDelivery.metadata) ?? {}),
        provider: result.provider,
        providerMessageId: result.providerMessageId
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected email delivery error'

      await this.emailRepository.markFailed(deliveryId, message)

      throw error
    }
  }

  private asMetadataObject(metadata: unknown): Record<string, unknown> | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null
    }

    return metadata as Record<string, unknown>
  }

  private extractRequiredText(metadata: unknown): string {
    const value = this.asMetadataObject(metadata)?.text

    if (typeof value !== 'string') {
      throw new Error('Email delivery metadata is missing text content')
    }

    return value
  }

  private extractRequiredHtml(metadata: unknown): string {
    const value = this.asMetadataObject(metadata)?.html

    if (typeof value !== 'string') {
      throw new Error('Email delivery metadata is missing html content')
    }

    return value
  }
}
