import { Injectable, Logger } from '@nestjs/common'

import { EmailProvider, EmailProviderSendInput, EmailProviderSendResult } from '../contracts/email-provider'

@Injectable()
export class LoggerEmailProvider implements EmailProvider {
  private readonly logger = new Logger(LoggerEmailProvider.name)

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    this.logger.log(
      JSON.stringify(
        {
          provider: 'logger',
          from: `${input.fromName} <${input.fromAddress}>`,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html
        },
        null,
        2
      )
    )

    return Promise.resolve({
      provider: 'logger',
      providerMessageId: null
    })
  }
}
