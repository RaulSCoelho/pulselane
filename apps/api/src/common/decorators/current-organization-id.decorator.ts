import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const CurrentOrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const organizationId = request.headers['x-organization-id'];

    if (!organizationId || typeof organizationId !== 'string') {
      throw new BadRequestException('x-organization-id header is required');
    }

    return organizationId;
  },
);
