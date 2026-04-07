import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentOrganization } from '@/common/decorators/current-organization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user';
import { OrganizationContextGuard } from '@/modules/organization/guards/organization-context.guard';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/requests/create-project.dto';
import { UpdateProjectDto } from './dto/requests/update-project.dto';
import { ListProjectsQueryDto } from './dto/requests/list-projects-query.dto';
import { ProjectResponseDto } from './dto/responses/project-response.dto';
import { ListProjectsResponseDto } from './dto/responses/list-projects-response.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-organization-id',
  required: true,
  description: 'Current organization context',
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'User is not a member of this organization',
  type: ErrorResponseDto,
})
@UseGuards(OrganizationContextGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiCreatedResponse({
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(actorUserId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @ApiOkResponse({
    description: 'Projects returned successfully',
    type: ListProjectsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ListProjectsResponseDto> {
    return this.projectsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiOkResponse({
    description: 'Project returned successfully',
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(organizationId, projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiOkResponse({
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(
      actorUserId,
      organizationId,
      projectId,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiOkResponse({
    description: 'Project deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
  ): Promise<SuccessResponseDto> {
    return this.projectsService.remove(actorUserId, organizationId, projectId);
  }
}
