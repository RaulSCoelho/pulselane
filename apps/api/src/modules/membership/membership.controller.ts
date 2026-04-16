import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import { SuccessResponseDto } from '@/common/dto/success-response.dto'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard'
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard'
import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
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

import { ListMembershipsQueryDto } from './dto/requests/list-memberships-query.dto'
import { UpdateMembershipRoleDto } from './dto/requests/update-membership-role.dto'
import { ListMembershipsResponseDto } from './dto/responses/list-memberships-response.dto'
import { MembershipResponseDto } from './dto/responses/membership-response.dto'
import { MembershipService } from './membership.service'

@ApiTags('Memberships')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-organization-id',
  required: true,
  description: 'Current organization context'
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto
})
@ApiForbiddenResponse({
  description: 'Forbidden',
  type: ErrorResponseDto
})
@UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
@Controller({ path: 'memberships', version: '1' })
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'List organization memberships' })
  @ApiOkResponse({
    description: 'Memberships returned successfully',
    type: ListMembershipsResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListMembershipsQueryDto
  ): Promise<ListMembershipsResponseDto> {
    return this.membershipService.findAllByOrganization(organizationId, query)
  }

  @Get(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'Get membership by id' })
  @ApiOkResponse({
    description: 'Membership returned successfully',
    type: MembershipResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Membership not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findOne(
    @CurrentOrganization('id') organizationId: string,
    @Param('id') membershipId: string
  ): Promise<MembershipResponseDto> {
    return this.membershipService.findOneByOrganization(organizationId, membershipId)
  }

  @Patch(':id/role')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'Update membership role' })
  @ApiOkResponse({
    description: 'Membership role updated successfully',
    type: MembershipResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Membership not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  updateRole(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') membershipId: string,
    @Body() dto: UpdateMembershipRoleDto
  ): Promise<MembershipResponseDto> {
    return this.membershipService.updateRole(actorUserId, organizationId, membershipId, dto)
  }

  @Delete(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'Remove membership' })
  @ApiOkResponse({
    description: 'Membership removed successfully',
    type: SuccessResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Membership not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Membership cannot be removed',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') membershipId: string
  ): Promise<SuccessResponseDto> {
    return this.membershipService.remove(actorUserId, organizationId, membershipId)
  }
}
