import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from '../organization.service';
import { RequestWithCurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { RequestWithOrganizationMembership } from '@/common/decorators/organization-membership.decorator';

type RequestWithOrganizationContext = RequestWithCurrentOrganization &
  RequestWithOrganizationMembership;

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganizationContext>();

    const userId = request.user?.sub;
    const organizationId = request.headers['x-organization-id'];

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!organizationId || typeof organizationId !== 'string') {
      throw new BadRequestException('x-organization-id header is required');
    }

    const { organization, membership } =
      await this.organizationService.findCurrentByUserId(
        userId,
        organizationId,
      );

    request.currentOrganization = organization;
    request.currentMembership = membership;

    return true;
  }
}
