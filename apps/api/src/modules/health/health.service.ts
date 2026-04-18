import { PrismaService } from '@/infra/prisma/prisma.service'
import { RedisService } from '@/infra/redis/redis.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  getLiveness() {
    return {
      status: 'ok',
      timestamp: this.nowIso(),
      uptimeSeconds: Math.round(process.uptime())
    }
  }

  async getDatabaseWarmup() {
    await this.assertDatabaseConnection()

    return {
      status: 'ok',
      target: 'database',
      operation: 'warmup',
      timestamp: this.nowIso()
    }
  }

  async touchDatabaseHeartbeat() {
    await this.assertDatabaseConnection()

    const now = new Date()

    const heartbeat = await this.prisma.systemHeartbeat.upsert({
      where: {
        serviceKey: 'database'
      },
      create: {
        serviceKey: 'database',
        lastSeenAt: now
      },
      update: {
        lastSeenAt: now
      }
    })

    return {
      status: 'ok',
      target: 'database',
      operation: 'heartbeat',
      serviceKey: heartbeat.serviceKey,
      lastSeenAt: heartbeat.lastSeenAt.toISOString(),
      timestamp: now.toISOString()
    }
  }

  async getReadiness() {
    const databaseOk = await this.isDatabaseOk()
    const redis = await this.getRedisHealth()
    const ready = databaseOk && (!redis.enabled || !redis.required || redis.status === 'ok')

    return {
      status: ready ? 'ready' : 'not_ready',
      timestamp: this.nowIso(),
      checks: {
        database: databaseOk ? 'ok' : 'error',
        redis: redis.status
      },
      dependencies: {
        redis
      }
    }
  }

  async getRedisHealth() {
    const redisEnabled = this.redisService.isEnabled()
    const redisRequired = this.redisService.isRequired()

    if (!redisEnabled) {
      return {
        status: 'disabled',
        target: 'redis',
        timestamp: this.nowIso(),
        enabled: false,
        required: redisRequired,
        state: this.redisService.getState(),
        lastError: this.redisService.getLastErrorMessage()
      }
    }

    const redisOk = await this.redisService.ping()

    return {
      status: redisOk ? 'ok' : 'error',
      target: 'redis',
      timestamp: this.nowIso(),
      enabled: true,
      required: redisRequired,
      state: this.redisService.getState(),
      lastError: this.redisService.getLastErrorMessage()
    }
  }

  private nowIso() {
    return new Date().toISOString()
  }

  private async isDatabaseOk() {
    try {
      await this.assertDatabaseConnection()
      return true
    } catch {
      return false
    }
  }

  private async assertDatabaseConnection() {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
