import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogAction,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
import { ProjectsService } from '@/modules/projects/projects.service';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
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
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    actorUserId: string,
    organizationId: string,
    dto: CreateTaskDto,
  ) {
    const project = await this.projectsService.findOne(
      organizationId,
      dto.projectId,
    );

    if (project.status === ProjectStatus.archived) {
      throw new BadRequestException(
        'Cannot create a task for an archived project',
      );
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

    const status = dto.status ?? TaskStatus.todo;

    const task = await this.taskRepository.create({
      organizationId,
      projectId: dto.projectId,
      assigneeUserId: dto.assigneeUserId,
      title: dto.title,
      description: dto.description,
      status,
      priority: dto.priority ?? TaskPriority.medium,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      archivedAt: status === TaskStatus.archived ? new Date() : null,
    });

    await this.auditLog(
      task,
      actorUserId,
      organizationId,
      AuditLogAction.created,
    );

    return task;
  }

  async findAll(organizationId: string, query: ListTasksQueryDto) {
    const limit = query.limit ?? 20;

    if (query.projectId) {
      await this.projectsService.findOne(organizationId, query.projectId);
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

    const { items, nextCursor, hasNextPage } =
      await this.taskRepository.findManyByOrganization({
        organizationId,
        projectId: query.projectId,
        assigneeUserId: query.assigneeUserId,
        search: query.search,
        status: query.status,
        priority: query.priority,
        includeArchived: query.includeArchived,
        cursor: query.cursor,
        limit,
      });

    return {
      items,
      meta: {
        limit,
        nextCursor,
        hasNextPage,
      },
    };
  }

  async findOne(organizationId: string, taskId: string) {
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
    actorUserId: string,
    organizationId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    await this.ensureTaskExists(taskId, organizationId);

    if (dto.projectId) {
      const project = await this.projectsService.findOne(
        organizationId,
        dto.projectId,
      );

      if (project.status === ProjectStatus.archived) {
        throw new BadRequestException(
          'Cannot move a task to an archived project',
        );
      }
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

    const task = await this.taskRepository.update(taskId, {
      ...dto,
      dueDate:
        dto.dueDate === undefined
          ? undefined
          : dto.dueDate
            ? new Date(dto.dueDate)
            : null,
      archivedAt:
        dto.status === undefined
          ? undefined
          : dto.status === TaskStatus.archived
            ? new Date()
            : null,
    });

    await this.auditLog(
      task,
      actorUserId,
      organizationId,
      AuditLogAction.updated,
    );

    return task;
  }

  async remove(actorUserId: string, organizationId: string, taskId: string) {
    await this.getTaskOrThrow(taskId, organizationId);

    const task = await this.taskRepository.archive(taskId);

    await this.auditLog(
      task,
      actorUserId,
      organizationId,
      AuditLogAction.archived,
    );

    return {
      success: true,
    };
  }

  private async ensureTaskExists(
    taskId: string,
    organizationId: string,
  ): Promise<void> {
    await this.getTaskOrThrow(taskId, organizationId);
  }

  private async getTaskOrThrow(taskId: string, organizationId: string) {
    const task = await this.taskRepository.findByIdAndOrganization(
      taskId,
      organizationId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async auditLog(
    task: Task,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
  ) {
    return this.auditLogsService.create({
      organizationId,
      actorUserId,
      entityType: 'task',
      entityId: task.id,
      action,
      metadata: {
        projectId: task.projectId,
        assigneeUserId: task.assigneeUserId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        archivedAt: task.archivedAt,
      },
    });
  }
}
