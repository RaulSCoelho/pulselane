import type { EnvConfig } from '@/config/env.config'
import { EmailModule } from '@/modules/email/email.module'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { EmailQueueService } from './email-queue.service'
import { EmailQueueProcessor } from './processors/email-queue.processor'
import { EMAIL_DELIVERY_QUEUE } from './queue.constants'

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

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const redisEnabled = configService.getOrThrow('redisEnabled', { infer: true })

        if (!redisEnabled) {
          throw new Error('QueueModule requires REDIS_ENABLED=true')
        }

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
  ],
  providers: [EmailQueueService, EmailQueueProcessor],
  exports: [EmailQueueService]
})
export class QueueModule {}
