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
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    }
  }

  async getReadiness() {
    let databaseOk = false

    try {
      await this.prisma.$queryRaw`SELECT 1`
      databaseOk = true
    } catch {
      databaseOk = false
    }

    const redisEnabled = this.redisService.isEnabled()
    const redisRequired = this.redisService.isRequired()

    let redisOk: boolean | null = null

    if (redisEnabled) {
      redisOk = await this.redisService.ping()
    }

    const ready = databaseOk && (!redisEnabled || !redisRequired || redisOk === true)

    return {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseOk ? 'ok' : 'error',
        redis: !redisEnabled ? 'disabled' : redisOk ? 'ok' : 'error'
      },
      dependencies: {
        redis: {
          enabled: redisEnabled,
          required: redisRequired,
          state: this.redisService.getState(),
          lastError: this.redisService.getLastErrorMessage()
        }
      }
    }
  }
}
