import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
import { ProjectsService } from '@/modules/projects/projects.service';
import { CreateTaskDto } from './dto/requests/create-task.dto';
import { ListTasksQueryDto } from './dto/requests/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/requests/update-task.dto';
import { TaskRepository } from './task.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly membershipService: MembershipService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateTaskDto) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.projectsService.findOne(userId, organizationId, dto.projectId);

    if (dto.assigneeUserId) {
      await this.membershipService.ensureUserIsMember(
        dto.assigneeUserId,
        organizationId,
        {
          notFoundMessage: 'Assignee not found in this organization',
          exceptionType: 'not_found',
        },
      );
    }

    return this.taskRepository.create({
      organizationId,
      projectId: dto.projectId,
      assigneeUserId: dto.assigneeUserId,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.todo,
      priority: dto.priority ?? TaskPriority.medium,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: ListTasksQueryDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    if (query.projectId) {
      await this.projectsService.findOne(
        userId,
        organizationId,
        query.projectId,
      );
    }

    if (query.assigneeUserId) {
      await this.membershipService.ensureUserIsMember(
        query.assigneeUserId,
        organizationId,
        {
          notFoundMessage: 'Assignee not found in this organization',
          exceptionType: 'not_found',
        },
      );
    }

    return this.taskRepository.findManyByOrganization({
      organizationId,
      projectId: query.projectId,
      assigneeUserId: query.assigneeUserId,
      search: query.search,
      status: query.status,
      priority: query.priority,
    });
  }

  async findOne(userId: string, organizationId: string, taskId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    const task = await this.taskRepository.findByIdAndOrganization(
      taskId,
      organizationId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    userId: string,
    organizationId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.ensureTaskExists(taskId, organizationId);

    if (dto.projectId) {
      await this.projectsService.findOne(userId, organizationId, dto.projectId);
    }

    if (dto.assigneeUserId) {
      await this.membershipService.ensureUserIsMember(
        dto.assigneeUserId,
        organizationId,
        {
          notFoundMessage: 'Assignee not found in this organization',
          exceptionType: 'not_found',
        },
      );
    }

    return this.taskRepository.update(taskId, {
      ...dto,
      dueDate:
        dto.dueDate === undefined
          ? undefined
          : dto.dueDate
            ? new Date(dto.dueDate)
            : null,
    });
  }

  async remove(userId: string, organizationId: string, taskId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.ensureTaskExists(taskId, organizationId);

    await this.taskRepository.delete(taskId);

    return {
      success: true,
    };
  }

  private async ensureTaskExists(
    taskId: string,
    organizationId: string,
  ): Promise<void> {
    const task = await this.taskRepository.findByIdAndOrganization(
      taskId,
      organizationId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
