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

import { CreateTaskDto } from './dto/requests/create-task.dto'
import { ListTasksQueryDto } from './dto/requests/list-tasks-query.dto'
import { UpdateTaskDto } from './dto/requests/update-task.dto'
import { ListTasksResponseDto } from './dto/responses/list-tasks-response.dto'
import { TaskResponseDto } from './dto/responses/task-response.dto'
import { TasksService } from './tasks.service'

@ApiTags('Tasks')
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
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Create task' })
  @ApiCreatedResponse({
    description: 'Task created successfully',
    type: TaskResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  create(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateTaskDto
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(actorUserId, organizationId, dto)
  }

  @Get()
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'List tasks' })
  @ApiOkResponse({
    description: 'Tasks returned successfully',
    type: ListTasksResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findAll(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ListTasksQueryDto
  ): Promise<ListTasksResponseDto> {
    return this.tasksService.findAll(organizationId, query)
  }

  @Get(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member, MembershipRole.viewer)
  @ApiOperation({ summary: 'Get task by id' })
  @ApiOkResponse({
    description: 'Task returned successfully',
    type: TaskResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  findOne(@CurrentOrganization('id') organizationId: string, @Param('id') taskId: string): Promise<TaskResponseDto> {
    return this.tasksService.findOne(organizationId, taskId)
  }

  @Patch(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin, MembershipRole.member)
  @ApiOperation({ summary: 'Update task' })
  @ApiOkResponse({
    description: 'Task updated successfully',
    type: TaskResponseDto
  })
  @ApiConflictResponse({
    description: 'Task was updated by another request',
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  update(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(actorUserId, organizationId, taskId, dto)
  }

  @Delete(':id')
  @OrganizationRoles(MembershipRole.owner, MembershipRole.admin)
  @ApiOperation({ summary: 'Archive task' })
  @ApiOkResponse({
    description: 'Task archived successfully',
    type: SuccessResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto
  })
  remove(
    @CurrentUser('sub') actorUserId: AccessRequestUser['sub'],
    @CurrentOrganization('id') organizationId: string,
    @Param('id') taskId: string
  ): Promise<SuccessResponseDto> {
    return this.tasksService.remove(actorUserId, organizationId, taskId)
  }
}
