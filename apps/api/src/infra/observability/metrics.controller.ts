import { Auth } from '@/common/decorators/auth.decorator'
import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'

import { MetricsService } from './metrics.service'

@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Auth({ mode: 'public' })
  @Get('metrics')
  async getMetrics(@Res() reply: FastifyReply) {
    reply.header('content-type', this.metricsService.getContentType())

    return reply.send(await this.metricsService.getMetrics())
  }
}
