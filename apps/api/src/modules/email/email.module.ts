import { EnvConfig } from '@/config/env.config'
import { DynamicModule, Module, type Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { EmailQueueProcessor } from '../queue/processors/email-queue.processor'
import { QueueModule } from '../queue/queue.module'
import { EmailDeliveryExecutorService } from './email-delivery-executor.service'
import { EMAIL_PROVIDER } from './email.constants'
import { EmailController } from './email.controller'
import { EmailRepository } from './email.repository'
import { EmailService } from './email.service'
import { LoggerEmailProvider } from './providers/logger-email-provider'
import { SmtpEmailProvider } from './providers/smtp-email-provider'

function isRedisEnabledFromEnv(): boolean {
  return process.env.REDIS_ENABLED === 'true'
}

@Module({})
export class EmailModule {
  static register(): DynamicModule {
    const redisEnabled = isRedisEnabledFromEnv()

    const providers: Provider[] = [
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
    ]

    if (redisEnabled) {
      providers.push(EmailQueueProcessor)
    }

    return {
      module: EmailModule,
      imports: [ConfigModule, QueueModule.register()],
      controllers: [EmailController],
      providers,
      exports: [EmailService, EmailDeliveryExecutorService]
    }
  }
}
