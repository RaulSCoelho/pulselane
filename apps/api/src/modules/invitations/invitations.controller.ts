import { Auth } from '@/common/decorators/auth.decorator'
import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard'
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard'
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
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

import { AcceptInvitationDto } from './dto/requests/accept-invitation.dto'
import { CreateInvitationDto } from './dto/requests/create-invitation.dto'
import { ListInvitationsQueryDto } from './dto/requests/list-invitations-query.dto'
import { PreviewInvitationQueryDto } from './dto/requests/preview-invitation-query.dto'
import { InvitationResponseDto } from './dto/responses/invitation-response.dto'
import { ListInvitationsResponseDto } from './dto/responses/list-invitations-response.dto'
import { PreviewInvitationResponseDto } from './dto/responses/preview-invitation-response.dto'
import { InvitationsService } from './invitations.service'

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Create organization invitation' })
  @ApiOkResponse({
    description: 'Invitation created successfully',
    type: InvitationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Invitation conflict',
    type: ErrorResponseDto
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateInvitationDto
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.create(actorUserId, organizationId, dto)
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'List organization invitations' })
  @ApiOkResponse({
    description: 'Invitations returned successfully',
    type: ListInvitationsResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListInvitationsQueryDto
  ): Promise<ListInvitationsResponseDto> {
    return this.invitationsService.findAll(organizationId, query)
  }

  @Get('preview')
  @Auth({ mode: 'public' })
  @ApiOperation({ summary: 'Preview invitation by token' })
  @ApiOkResponse({
    description: 'Invitation preview returned successfully',
    type: PreviewInvitationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found',
    type: ErrorResponseDto
  })
  preview(@Query() query: PreviewInvitationQueryDto): Promise<PreviewInvitationResponseDto> {
    return this.invitationsService.preview(query)
  }

  @Patch(':id/revoke')
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Revoke pending invitation' })
  @ApiOkResponse({
    description: 'Invitation revoked successfully',
    type: InvitationResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Invitation cannot be revoked',
    type: ErrorResponseDto
  })
  revoke(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') invitationId: string
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.revoke(actorUserId, organizationId, invitationId)
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @UseGuards(OrganizationContextGuard, OrganizationRolesGuard)
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiHeader({
    name: 'x-organization-id',
    required: true,
    description: 'Current organization context'
  })
  @ApiOperation({ summary: 'Resend pending or expired invitation' })
  @ApiOkResponse({
    description: 'Invitation resent successfully',
    type: InvitationResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Invitation cannot be resent',
    type: ErrorResponseDto
  })
  resend(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') invitationId: string
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.resend(actorUserId, organizationId, invitationId)
  }

  @Post('accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept invitation using token' })
  @ApiOkResponse({
    description: 'Invitation accepted successfully',
    type: InvitationResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Invitation conflict',
    type: ErrorResponseDto
  })
  @ApiForbiddenResponse({
    description: 'Invitation cannot be accepted by this user',
    type: ErrorResponseDto
  })
  accept(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @Body() dto: AcceptInvitationDto
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.accept(actorUserId, dto)
  }
}
