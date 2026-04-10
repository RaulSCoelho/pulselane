import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogAction,
  ClientStatus,
  Project,
  ProjectStatus,
} from '@prisma/client';
import { ClientsService } from '@/modules/clients/clients.service';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { CreateProjectDto } from './dto/requests/create-project.dto';
import { ListProjectsQueryDto } from './dto/requests/list-projects-query.dto';
import { UpdateProjectDto } from './dto/requests/update-project.dto';
import { ProjectRepository } from './project.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly clientsService: ClientsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    actorUserId: string,
    organizationId: string,
    dto: CreateProjectDto,
  ) {
    const client = await this.clientsService.findOne(
      organizationId,
      dto.clientId,
    );

    if (client.status === ClientStatus.archived) {
      throw new BadRequestException(
        'Cannot create a project for an archived client',
      );
    }

    const status = dto.status ?? ProjectStatus.active;

    const project = await this.projectRepository.create({
      organizationId,
      clientId: dto.clientId,
      name: dto.name,
      description: dto.description,
      status,
      archivedAt: status === ProjectStatus.archived ? new Date() : null,
    });

    await this.auditLog(
      project,
      actorUserId,
      organizationId,
      AuditLogAction.created,
    );

    return project;
  }

  async findAll(organizationId: string, query: ListProjectsQueryDto) {
    const limit = query.limit ?? 20;

    if (query.clientId) {
      await this.clientsService.findOne(organizationId, query.clientId);
    }

    const { items, nextCursor, hasNextPage } =
      await this.projectRepository.findManyByOrganization({
        organizationId,
        clientId: query.clientId,
        search: query.search,
        status: query.status,
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

  async findOne(organizationId: string, projectId: string) {
    const project = await this.projectRepository.findByIdAndOrganization(
      projectId,
      organizationId,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    actorUserId: string,
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.ensureProjectExists(projectId, organizationId);

    if (dto.clientId) {
      const client = await this.clientsService.findOne(
        organizationId,
        dto.clientId,
      );

      if (client.status === ClientStatus.archived) {
        throw new BadRequestException(
          'Cannot move a project to an archived client',
        );
      }
    }

    const project = await this.projectRepository.update(projectId, {
      ...dto,
      archivedAt:
        dto.status === undefined
          ? undefined
          : dto.status === ProjectStatus.archived
            ? new Date()
            : null,
    });

    await this.auditLog(
      project,
      actorUserId,
      organizationId,
      AuditLogAction.updated,
    );

    return project;
  }

  async remove(actorUserId: string, organizationId: string, projectId: string) {
    await this.getProjectOrThrow(projectId, organizationId);

    const project = await this.projectRepository.archive(projectId);

    await this.auditLog(
      project,
      actorUserId,
      organizationId,
      AuditLogAction.archived,
    );

    return {
      success: true,
    };
  }

  private async ensureProjectExists(
    projectId: string,
    organizationId: string,
  ): Promise<void> {
    await this.getProjectOrThrow(projectId, organizationId);
  }

  private async getProjectOrThrow(projectId: string, organizationId: string) {
    const project = await this.projectRepository.findByIdAndOrganization(
      projectId,
      organizationId,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async auditLog(
    project: Project,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
  ) {
    return this.auditLogsService.create({
      organizationId,
      actorUserId,
      entityType: 'project',
      entityId: project.id,
      action,
      metadata: {
        clientId: project.clientId,
        name: project.name,
        description: project.description,
        status: project.status,
        archivedAt: project.archivedAt,
      },
    });
  }
}
