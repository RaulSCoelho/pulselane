import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { FastifyRequest, FastifyReply } from 'fastify'

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: FastifyRequest): Promise<string> {
    const forwardedFor = request.headers['x-forwarded-for']

    if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
      return forwardedFor.split(',')[0].trim()
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0]
    }

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
