import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryStatus } from '@prisma/client';
import { EnvConfig } from '@/config/env.config';
import { SendEmailInput } from './contracts/send-email.input';
import { EmailRepository } from './email.repository';
import { ListEmailDeliveriesQueryDto } from './dto/requests/list-email-deliveries-query.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly emailRepository: EmailRepository,
  ) {}

  async send(input: SendEmailInput) {
    const transport = this.configService.get('emailTransport', { infer: true });
    const fromName = this.configService.get('emailFromName', { infer: true });
    const fromAddress = this.configService.get('emailFromAddress', {
      infer: true,
    });

    const delivery = await this.emailRepository.create({
      organizationId: input.organizationId,
      sentBy: input.sentBy ?? null,
      to: input.to,
      subject: input.subject,
      transport,
      status: EmailDeliveryStatus.pending,
      metadata: input.metadata,
    });

    try {
      if (transport === 'logger') {
        // Logger transport keeps the flow usable locally while still producing
        // a persisted delivery record with tenant and sender attribution.
        this.logger.log(
          JSON.stringify(
            {
              transport,
              from: `${fromName} <${fromAddress}>`,
              organizationId: input.organizationId,
              sentBy: input.sentBy ?? null,
              to: input.to,
              subject: input.subject,
              text: input.text,
              html: input.html,
            },
            null,
            2,
          ),
        );
      }

      return this.emailRepository.update(delivery.id, {
        status: EmailDeliveryStatus.sent,
        sentAt: new Date(),
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected email delivery error';

      await this.emailRepository.update(delivery.id, {
        status: EmailDeliveryStatus.failed,
        error: message,
      });

      throw error;
    }
  }

  async findAll(organizationId: string, query: ListEmailDeliveriesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } = await this.emailRepository.findMany({
      organizationId,
      page,
      pageSize,
      to: query.to,
      status: query.status,
    });

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
