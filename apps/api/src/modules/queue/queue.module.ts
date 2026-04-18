import type { EnvConfig } from '@/config/env.config'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { DynamicModule, Module, type Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { EmailQueueService } from './email-queue.service'
import { EMAIL_DELIVERY_QUEUE, EMAIL_DELIVERY_QUEUE_TOKEN } from './queue.constants'

function isRedisEnabledFromEnv(): boolean {
  return process.env.REDIS_ENABLED === 'true'
}

function buildBullRedisConnection(redisUrl: string) {
  const parsed = new URL(redisUrl)

  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://')
  }

  const db = parsed.pathname ? Number(parsed.pathname.replace('/', '') || '0') : 0

  if (Number.isNaN(db)) {
    throw new Error('REDIS_URL contains an invalid database index')
  }

  return {
    host: parsed.hostname,
    port: Number(parsed.port || '6379'),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {})
  }
}

@Module({})
export class QueueModule {
  static register(): DynamicModule {
    const redisEnabled = isRedisEnabledFromEnv()

    const imports = redisEnabled
      ? [
          ConfigModule,
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<EnvConfig, true>) => {
              const redisUrl = configService.getOrThrow('redisUrl', { infer: true })

              return {
                connection: buildBullRedisConnection(redisUrl),
                prefix: 'pulselane'
              }
            }
          }),
          BullModule.registerQueue({
            name: EMAIL_DELIVERY_QUEUE
          })
        ]
      : [ConfigModule]

    const providers: Provider[] = redisEnabled
      ? [
          {
            provide: EMAIL_DELIVERY_QUEUE_TOKEN,
            useExisting: getQueueToken(EMAIL_DELIVERY_QUEUE)
          },
          EmailQueueService
        ]
      : [
          {
            provide: EMAIL_DELIVERY_QUEUE_TOKEN,
            useValue: null
          },
          EmailQueueService
        ]

    return {
      module: QueueModule,
      imports,
      providers,
      exports: [EmailQueueService]
    }
  }
}
