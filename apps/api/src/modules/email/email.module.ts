import { EnvConfig } from '@/config/env.config'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { QueueModule } from '../queue/queue.module'
import { EmailDeliveryExecutorService } from './email-delivery-executor.service'
import { EMAIL_PROVIDER } from './email.constants'
import { EmailController } from './email.controller'
import { EmailRepository } from './email.repository'
import { EmailService } from './email.service'
import { LoggerEmailProvider } from './providers/logger-email-provider'
import { SmtpEmailProvider } from './providers/smtp-email-provider'

@Module({
  imports: [ConfigModule, OrganizationModule, forwardRef(() => QueueModule)],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailDeliveryExecutorService,
    EmailRepository,
    LoggerEmailProvider,
    SmtpEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, LoggerEmailProvider, SmtpEmailProvider],
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        loggerProvider: LoggerEmailProvider,
        smtpProvider: SmtpEmailProvider
      ) => {
        const transport = configService.get('emailTransport', { infer: true })

        if (transport === 'smtp') {
          return smtpProvider
        }

        return loggerProvider
      }
    }
  ],
  exports: [EmailService, EmailDeliveryExecutorService]
})
export class EmailModule {}
