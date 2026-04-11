import { RequestWithOrganizationMembership } from '@/common/decorators/organization-membership.decorator'
import { ORGANIZATION_ROLES_KEY } from '@/common/decorators/organization-roles.decorator'
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { MembershipRole } from '@prisma/client'

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(ORGANIZATION_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithOrganizationMembership>()

    // OrganizationContextGuard is expected to run first and attach the current
    // membership that role checks are based on.
    const role = request.currentMembership?.role

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('You do not have permission to perform this action')
    }

    return true
  }
}
