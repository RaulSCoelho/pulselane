import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EmailService } from './email.service';
import { EmailRepository } from './email.repository';
import { EmailController } from './email.controller';
import { LoggerEmailProvider } from './providers/logger-email-provider';
import { SmtpEmailProvider } from './providers/smtp-email-provider';
import { EMAIL_PROVIDER } from './email.constants';
import { EnvConfig } from '@/config/env.config';

@Module({
  imports: [ConfigModule, OrganizationModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailRepository,
    LoggerEmailProvider,
    SmtpEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, LoggerEmailProvider, SmtpEmailProvider],
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        loggerProvider: LoggerEmailProvider,
        smtpProvider: SmtpEmailProvider,
      ) => {
        const transport = configService.get('emailTransport', { infer: true });

        if (transport === 'smtp') {
          return smtpProvider;
        }

        return loggerProvider;
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
