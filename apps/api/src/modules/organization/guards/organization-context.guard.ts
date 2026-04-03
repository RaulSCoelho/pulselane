import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from '../organization.service';
import { RequestWithCurrentOrganization } from '@/common/decorators/current-organization.decorator';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithCurrentOrganization>();

    const userId = request.user?.sub;
    const organizationId = request.headers['x-organization-id'];

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!organizationId || typeof organizationId !== 'string') {
      throw new BadRequestException('x-organization-id header is required');
    }

    const organization = await this.organizationService.findCurrentByUserId(
      userId,
      organizationId,
    );

    request.currentOrganization = organization;

    return true;
  }
}
