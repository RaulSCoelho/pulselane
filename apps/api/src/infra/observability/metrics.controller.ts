import { Auth } from '@/common/decorators/auth.decorator'
import type { EnvConfig } from '@/config/env.config'
import { Controller, Get, Headers, Res, UnauthorizedException, VERSION_NEUTRAL } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiExcludeController } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'
import { timingSafeEqual } from 'node:crypto'

import { MetricsService } from './metrics.service'

@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService<EnvConfig, true>
  ) {}

  @Auth({ mode: 'public' })
  @Get('metrics')
  async getMetrics(@Headers('authorization') authorizationHeader: string | undefined, @Res() reply: FastifyReply) {
    const expectedToken = this.configService.getOrThrow('metricsBearerToken', { infer: true })
    const providedToken = this.extractBearerToken(authorizationHeader)

    if (!providedToken || !this.tokensMatch(providedToken, expectedToken)) {
      throw new UnauthorizedException('Unauthorized')
    }

    reply.header('content-type', this.metricsService.getContentType())
    reply.header('cache-control', 'no-store')

    return reply.send(await this.metricsService.getMetrics())
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      return null
    }

    const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2)

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null
    }

    return token
  }

  private tokensMatch(providedToken: string, expectedToken: string) {
    const providedBuffer = Buffer.from(providedToken)
    const expectedBuffer = Buffer.from(expectedToken)

    if (providedBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(providedBuffer, expectedBuffer)
  }
}
