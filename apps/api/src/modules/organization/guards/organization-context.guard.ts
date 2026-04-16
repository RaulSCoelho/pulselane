import { RequestWithCurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { RequestWithOrganizationMembership } from '@/common/decorators/organization-membership.decorator'
import { PrismaService } from '@/infra/prisma/prisma.service'
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

type RequestWithOrganizationContext = RequestWithCurrentOrganization & RequestWithOrganizationMembership

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithOrganizationContext>()

    const userId = request.user?.sub
    const organizationId = request.headers['x-organization-id']

    if (!userId) {
      throw new UnauthorizedException('Unauthorized')
    }

    if (!organizationId || typeof organizationId !== 'string') {
      throw new BadRequestException('x-organization-id header is required')
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId
      },
      include: {
        organization: true
      }
    })

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization')
    }

    request.currentOrganization = membership.organization
    request.currentMembership = membership

    return true
  }
}
