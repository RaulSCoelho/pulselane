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

import { CreateProjectDto } from './dto/requests/create-project.dto'
import { ListProjectsQueryDto } from './dto/requests/list-projects-query.dto'
import { UpdateProjectDto } from './dto/requests/update-project.dto'
import { ListProjectsResponseDto } from './dto/responses/list-projects-response.dto'
import { ProjectResponseDto } from './dto/responses/project-response.dto'
import { ProjectsService } from './projects.service'

@ApiTags('Projects')
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
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Create project' })
  @ApiCreatedResponse({
    description: 'Project created successfully',
    type: ProjectResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateProjectDto
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(actorUserId, organizationId, dto)
  }

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'List projects' })
  @ApiOkResponse({
    description: 'Projects returned successfully',
    type: ListProjectsResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListProjectsQueryDto
  ): Promise<ListProjectsResponseDto> {
    return this.projectsService.findAll(organizationId, query)
  }

  @Get(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'Get project by id' })
  @ApiOkResponse({
    description: 'Project returned successfully',
    type: ProjectResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findOne(
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(organizationId, projectId)
  }

  @Patch(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Update project' })
  @ApiOkResponse({
    description: 'Project updated successfully',
    type: ProjectResponseDto
  })
  @ApiConflictResponse({
    description: 'Project was updated by another request',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  update(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(actorUserId, organizationId, projectId, dto)
  }

  @Delete(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'Archive project' })
  @ApiOkResponse({
    description: 'Project archived successfully',
    type: SuccessResponseDto
  })
  @ApiConflictResponse({
    description: 'Project cannot be archived while it has open tasks',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string
  ): Promise<SuccessResponseDto> {
    return this.projectsService.remove(actorUserId, organizationId, projectId)
  }
}
