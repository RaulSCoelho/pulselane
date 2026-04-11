import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Membership } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

export type RequestWithOrganizationMembership = FastifyRequest & {
  currentMembership?: Membership
}

export const CurrentOrganizationMembership = createParamDecorator(
  (field: keyof Membership | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithOrganizationMembership>()

    const membership = request.currentMembership

    if (!field) {
      return membership
    }

    return membership?.[field]
  }
)
