import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@/config/env.config';
import {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from '../contracts/email-provider';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('emailSmtpHost', { infer: true }),
      port: this.configService.get('emailSmtpPort', { infer: true }),
      secure: this.configService.get('emailSmtpSecure', { infer: true }),
      auth: {
        user: this.configService.get('emailSmtpUser', { infer: true }),
        pass: this.configService.get('emailSmtpPassword', { infer: true }),
      },
    });
  }

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const info = await this.transporter.sendMail({
      from: `${input.fromName} <${input.fromAddress}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return {
      provider: 'smtp',
      providerMessageId: info.messageId ?? null,
    };
  }
}
