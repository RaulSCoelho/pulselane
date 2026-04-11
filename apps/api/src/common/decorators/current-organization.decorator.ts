import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Organization } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

export type RequestWithCurrentOrganization = FastifyRequest & {
  currentOrganization?: Organization
}

export const CurrentOrganization = createParamDecorator(
  (field: keyof Organization | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithCurrentOrganization>()
    const organization = request.currentOrganization

    if (!field) {
      return organization
    }

    return organization?.[field]
  }
)
