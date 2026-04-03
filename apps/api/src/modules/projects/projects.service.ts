import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, Project, ProjectStatus } from '@prisma/client';
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
    await this.clientsService.findOne(organizationId, dto.clientId);

    const project = await this.projectRepository.create({
      organizationId,
      clientId: dto.clientId,
      name: dto.name,
      description: dto.description,
      status: dto.status ?? ProjectStatus.active,
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
    if (query.clientId) {
      await this.clientsService.findOne(organizationId, query.clientId);
    }

    return this.projectRepository.findManyByOrganization({
      organizationId,
      clientId: query.clientId,
      search: query.search,
      status: query.status,
    });
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
      await this.clientsService.findOne(organizationId, dto.clientId);
    }

    const project = await this.projectRepository.update(projectId, dto);

    await this.auditLog(
      project,
      actorUserId,
      organizationId,
      AuditLogAction.updated,
    );

    return project;
  }

  async remove(actorUserId: string, organizationId: string, projectId: string) {
    const project = await this.getProjectOrThrow(projectId, organizationId);

    await this.projectRepository.delete(projectId);

    await this.auditLog(
      project,
      actorUserId,
      organizationId,
      AuditLogAction.deleted,
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
      },
    });
  }
}
