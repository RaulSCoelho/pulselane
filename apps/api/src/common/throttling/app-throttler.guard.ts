import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { FastifyRequest, FastifyReply } from 'fastify'

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: FastifyRequest): Promise<string> {
    return Promise.resolve(request.ip)
  }

  protected getRequestResponse(context: ExecutionContext): { req: FastifyRequest; res: FastifyReply } {
    const httpContext = context.switchToHttp()

    return {
      req: httpContext.getRequest<FastifyRequest>(),
      res: httpContext.getResponse<FastifyReply>()
    }
  }
}
