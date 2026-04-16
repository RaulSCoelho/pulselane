import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { Observable } from 'rxjs'

import { MetricsService } from './metrics.service'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest>()
    const reply = httpContext.getResponse<FastifyReply>()

    const startedAt = process.hrtime.bigint()
    const route = this.resolveRoute(request)

    reply.raw.once('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000

      this.metricsService.recordHttpRequest({
        method: request.method,
        route,
        statusCode: reply.statusCode,
        durationSeconds
      })
    })

    return next.handle()
  }

  private resolveRoute(request: FastifyRequest): string {
    const routeFromFastify = request.routeOptions?.url
    const routeFromRouterPath = (request as FastifyRequest & { routerPath?: string }).routerPath
    const fallback = request.url

    return routeFromFastify ?? routeFromRouterPath ?? fallback
  }
}
