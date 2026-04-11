import type { EnvConfig } from '@/config/env.config'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { FastifyRequest } from 'fastify'
import { PinoLogger } from 'nestjs-pino'
import { Observable, tap } from 'rxjs'

@Injectable()
export class SlowRequestInterceptor implements NestInterceptor {
  private readonly slowRequestThresholdMs: number

  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService<EnvConfig, true>
  ) {
    this.logger.setContext(SlowRequestInterceptor.name)
    this.slowRequestThresholdMs = this.configService.getOrThrow('slowRequestThresholdMs', { infer: true })
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest>()
    const startedAt = performance.now()

    return next.handle().pipe(
      tap({
        next: () => {
          this.logIfSlow(request, startedAt)
        },
        error: () => {
          this.logIfSlow(request, startedAt)
        }
      })
    )
  }

  private logIfSlow(request: FastifyRequest, startedAt: number) {
    const durationMs = Math.round(performance.now() - startedAt)

    if (durationMs < this.slowRequestThresholdMs) {
      return
    }

    const currentUser = request.user
    const organizationIdHeader = request.headers['x-organization-id']
    const organizationId =
      typeof organizationIdHeader === 'string'
        ? organizationIdHeader
        : Array.isArray(organizationIdHeader)
          ? organizationIdHeader[0]
          : undefined

    this.logger.warn({
      message: 'Slow request detected',
      module: 'http',
      method: request.method,
      path: request.url,
      duration_ms: durationMs,
      request_id: request.id,
      user_id: currentUser?.sub,
      organization_id: organizationId
    })
  }
}
