import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'

export const CurrentUser = createParamDecorator((field: string | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>()
  const user = request.user

  if (!field) {
    return user
  }

  return user?.[field as keyof typeof user]
})
