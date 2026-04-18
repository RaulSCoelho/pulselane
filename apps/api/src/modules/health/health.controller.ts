import { Auth } from '@/common/decorators/auth.decorator'
import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'

import { HealthService } from './health.service'

@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Auth({ mode: 'public' })
  @Get('health')
  getHealth() {
    return this.healthService.getLiveness()
  }

  @Auth({ mode: 'public' })
  @Get('db-warmup')
  async getDatabaseWarmup() {
    return this.healthService.getDatabaseWarmup()
  }

  @Auth({ mode: 'public' })
  @Get('db-heartbeat')
  async getDatabaseHeartbeat() {
    return this.healthService.touchDatabaseHeartbeat()
  }

  @Auth({ mode: 'public' })
  @Get('readiness')
  async getReadiness() {
    const readiness = await this.healthService.getReadiness()

    if (readiness.status !== 'ready') {
      throw new ServiceUnavailableException(readiness)
    }

    return readiness
  }

  @Auth({ mode: 'public' })
  @Get('redis-health')
  async getRedisHealth() {
    const redisHealth = await this.healthService.getRedisHealth()

    if (redisHealth.status === 'error') {
      throw new ServiceUnavailableException(redisHealth)
    }

    return redisHealth
  }
}
