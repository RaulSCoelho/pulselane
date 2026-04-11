import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryStatus, Prisma } from '@prisma/client';
import { EnvConfig } from '@/config/env.config';
import { SendEmailInput } from './contracts/send-email.input';
import { EmailRepository } from './email.repository';
import { ListEmailDeliveriesQueryDto } from './dto/requests/list-email-deliveries-query.dto';
import { EMAIL_PROVIDER } from './email.constants';
import { type EmailProvider } from './contracts/email-provider';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly emailRepository: EmailRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  private get env() {
    return {
      fromName: this.configService.get('emailFromName', { infer: true }),
      fromAddress: this.configService.get('emailFromAddress', { infer: true }),
      transport: this.configService.get('emailTransport', { infer: true }),
    };
  }

  async send(input: SendEmailInput, tx?: Prisma.TransactionClient) {
    const fromName = this.env.fromName;
    const fromAddress = this.env.fromAddress;
    const transport = this.env.transport;

    const delivery = await this.emailRepository.create(
      {
        organizationId: input.organizationId,
        sentBy: input.sentBy ?? null,
        to: input.to,
        subject: input.subject,
        transport,
        status: EmailDeliveryStatus.pending,
        metadata: input.metadata,
      },
      tx,
    );

    try {
      const result = await this.emailProvider.send({
        fromName,
        fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      return this.emailRepository.update(
        delivery.id,
        {
          status: EmailDeliveryStatus.sent,
          sentAt: new Date(),
          error: null,
          metadata: {
            ...(delivery.metadata as Record<string, unknown> | null),
            provider: result.provider,
            providerMessageId: result.providerMessageId,
          },
        },
        tx,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected email delivery error';

      await this.emailRepository.update(
        delivery.id,
        {
          status: EmailDeliveryStatus.failed,
          error: message,
        },
        tx,
      );

      throw error;
    }
  }

  async findAll(
    organizationId: string,
    query: ListEmailDeliveriesQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const limit = query.limit ?? 20;

    const result = await this.emailRepository.findMany(
      {
        organizationId,
        cursor: query.cursor,
        limit,
        to: query.to,
        status: query.status,
      },
      tx,
    );

    return {
      items: result.items,
      meta: {
        limit,
        hasNextPage: result.hasNextPage,
        nextCursor: result.nextCursor,
      },
    };
  }
}
