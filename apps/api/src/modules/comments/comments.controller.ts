import { CurrentOrganization } from '@/common/decorators/current-organization.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { OrganizationRoles } from '@/common/decorators/organization-roles.decorator'
import { ErrorResponseDto } from '@/common/dto/error-response.dto'
import { SuccessResponseDto } from '@/common/dto/success-response.dto'
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user'
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard'
import { OrganizationRolesGuard } from '@/modules/organization/guards/organization-roles.guard'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'

import { CommentsService } from './comments.service'
import { CreateCommentDto } from './dto/requests/create-comment.dto'
import { ListCommentActivityHistoryQueryDto } from './dto/requests/list-comment-activity-history-query.dto'
import { ListCommentsQueryDto } from './dto/requests/list-comments-query.dto'
import { UpdateCommentDto } from './dto/requests/update-comment.dto'
import { CommentResponseDto } from './dto/responses/comment-response.dto'
import { ListCommentActivityHistoryResponseDto } from './dto/responses/list-comment-activity-history-response.dto'
import { ListCommentsResponseDto } from './dto/responses/list-comments-response.dto'

@ApiTags('Comments')
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
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Create comment for a task' })
  @ApiCreatedResponse({
    description: 'Comment created successfully',
    type: CommentResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(actorUserId, organizationId, dto)
  }

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'List comments by task' })
  @ApiOkResponse({
    description: 'Comments returned successfully',
    type: ListCommentsResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListCommentsQueryDto
  ): Promise<ListCommentsResponseDto> {
    return this.commentsService.findAll(organizationId, query)
  }

  @Get('activity-history')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'List minimal activity history by task based on comments and audit logs' })
  @ApiOkResponse({
    description: 'Activity history returned successfully',
    type: ListCommentActivityHistoryResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  getActivityHistory(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListCommentActivityHistoryQueryDto
  ): Promise<ListCommentActivityHistoryResponseDto> {
    return this.commentsService.findActivityHistory(organizationId, query)
  }

  @Patch(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Update comment' })
  @ApiOkResponse({
    description: 'Comment updated successfully',
    type: CommentResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Comment cannot be updated',
    type: ErrorResponseDto
  })
  update(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(actorUserId, organizationId, commentId, dto)
  }

  @Delete(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Soft delete comment' })
  @ApiOkResponse({
    description: 'Comment deleted successfully',
    type: SuccessResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
    type: ErrorResponseDto
  })
  @ApiConflictResponse({
    description: 'Comment cannot be deleted',
    type: ErrorResponseDto
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') commentId: string
  ): Promise<SuccessResponseDto> {
    return this.commentsService.remove(actorUserId, organizationId, commentId)
  }
}
