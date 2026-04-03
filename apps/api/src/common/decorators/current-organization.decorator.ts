import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Organization } from '@prisma/client';

export type RequestWithCurrentOrganization = FastifyRequest & {
  currentOrganization?: Organization;
};

export const CurrentOrganization = createParamDecorator(
  (field: keyof Organization | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithCurrentOrganization>();
    const organization = request.currentOrganization;

    if (!field) {
      return organization;
    }

    return organization?.[field];
  },
);
