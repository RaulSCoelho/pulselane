import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

import { CurrentOrganizationId } from '@/common/decorators/current-organization-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import type { AccessRequestUser } from '@/modules/auth/contracts/access-request-user';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/requests/create-task.dto';
import { UpdateTaskDto } from './dto/requests/update-task.dto';
import { ListTasksQueryDto } from './dto/requests/list-tasks-query.dto';
import { TaskResponseDto } from './dto/responses/task-response.dto';
import { ListTasksResponseDto } from './dto/responses/list-tasks-response.dto';

@ApiTags('Tasks')
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
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create task' })
  @ApiCreatedResponse({
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganizationId() organizationId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(userId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks' })
  @ApiOkResponse({
    description: 'Tasks returned successfully',
    type: ListTasksResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error, invalid query parameters, or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganizationId() organizationId: string,
    @Query() query: ListTasksQueryDto,
  ): Promise<ListTasksResponseDto> {
    const items = await this.tasksService.findAll(
      userId,
      organizationId,
      query,
    );

    return { items };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by id' })
  @ApiOkResponse({
    description: 'Task returned successfully',
    type: TaskResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganizationId() organizationId: string,
    @Param('id') taskId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(userId, organizationId, taskId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiOkResponse({
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganizationId() organizationId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(userId, organizationId, taskId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiOkResponse({
    description: 'Task deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or missing x-organization-id header',
    type: ErrorResponseDto,
  })
  remove(
    @CurrentUser('sub') userId: AccessRequestUser['sub'],
    @CurrentOrganizationId() organizationId: string,
    @Param('id') taskId: string,
  ): Promise<SuccessResponseDto> {
    return this.tasksService.remove(userId, organizationId, taskId);
  }
}
