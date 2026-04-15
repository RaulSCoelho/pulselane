import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'

import { UpdateOrganizationDto } from './dto/requests/update-organization.dto'
import { CurrentOrganizationResponseDto } from './dto/responses/current-organization-response.dto'
import { ListOrganizationsResponseDto } from './dto/responses/list-organizations-response.dto'
import { OrganizationContextGuard } from './guards/organization-context.guard'
import { OrganizationRolesGuard } from './guards/organization-roles.guard'
import { OrganizationService } from './organization.service'

@ApiTags('Organizations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto
})
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations for current user' })
  @ApiOkResponse({
    description: 'Organizations returned successfully',
    type: ListOrganizationsResponseDto
  })
  async list(@CurrentUser('sub') userId: AccessRequestUser['sub']): Promise<ListOrganizationsResponseDto> {
    return this.organizationService.findAllByUserId(userId).then(items => ({
      items
    }))
  }

  @Get('current')
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Get current organization payload by header context' })
  @ApiOkResponse({
    description: 'Current organization returned successfully',
    type: CurrentOrganizationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Missing x-organization-id header',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'User is not a member of this organization',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
    type: ErrorResponseDto
  })
  current(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string
  ): Promise<CurrentOrganizationResponseDto> {
    return this.organizationService.getCurrentPayload(userId, organizationId)
  }

  @Patch('current')
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Update current organization by header context' })
  @ApiOkResponse({
    description: 'Organization updated successfully',
    type: CurrentOrganizationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this organization',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Organization slug already in use',
    type: ErrorResponseDto
  })
  updateCurrent(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: UpdateOrganizationDto
  ): Promise<CurrentOrganizationResponseDto> {
    return this.organizationService.updateCurrent(actorUserId, organizationId, dto)
  }
}
