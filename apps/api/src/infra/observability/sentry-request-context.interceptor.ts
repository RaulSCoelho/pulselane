import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { Observable } from 'rxjs'

import { ObservabilityService } from './observability.service'

@Injectable()
export class SentryRequestContextInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest | undefined>()

    if (request) {
      this.observabilityService.applyRequestContext(request)
    }

    return next.handle()
  }
}
