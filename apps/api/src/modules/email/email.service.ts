import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@/config/env.config';
import { SendEmailInput } from './contracts/send-email.input';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  send(input: SendEmailInput): void {
    const transport = this.configService.get('emailTransport', { infer: true });
    const fromName = this.configService.get('emailFromName', { infer: true });
    const fromAddress = this.configService.get('emailFromAddress', {
      infer: true,
    });

    if (transport === 'logger') {
      // Logger transport keeps the invitation flow fully usable in development
      // while avoiding premature coupling to an external provider.
      this.logger.log(
        JSON.stringify(
          {
            transport,
            from: `${fromName} <${fromAddress}>`,
            to: input.to,
            subject: input.subject,
            text: input.text,
            html: input.html,
          },
          null,
          2,
        ),
      );

      return;
    }
  }
}
