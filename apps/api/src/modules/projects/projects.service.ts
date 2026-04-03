import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, Project, ProjectStatus } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
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
    private readonly membershipService: MembershipService,
    private readonly clientsService: ClientsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateProjectDto) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.clientsService.findOne(userId, organizationId, dto.clientId);

    const project = await this.projectRepository.create({
      organizationId,
      clientId: dto.clientId,
      name: dto.name,
      description: dto.description,
      status: dto.status ?? ProjectStatus.active,
    });

    await this.auditLog(
      project,
      userId,
      organizationId,
      AuditLogAction.created,
    );

    return project;
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: ListProjectsQueryDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    if (query.clientId) {
      await this.clientsService.findOne(userId, organizationId, query.clientId);
    }

    return this.projectRepository.findManyByOrganization({
      organizationId,
      clientId: query.clientId,
      search: query.search,
      status: query.status,
    });
  }

  async findOne(userId: string, organizationId: string, projectId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

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
    userId: string,
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.ensureProjectExists(projectId, organizationId);

    if (dto.clientId) {
      await this.clientsService.findOne(userId, organizationId, dto.clientId);
    }

    const project = await this.projectRepository.update(projectId, dto);

    await this.auditLog(
      project,
      userId,
      organizationId,
      AuditLogAction.updated,
    );

    return project;
  }

  async remove(userId: string, organizationId: string, projectId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    const project = await this.getProjectOrThrow(projectId, organizationId);

    await this.projectRepository.delete(projectId);

    await this.auditLog(
      project,
      userId,
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
    userId: string,
    organizationId: string,
    action: AuditLogAction,
  ) {
    return this.auditLogsService.create({
      organizationId,
      actorUserId: userId,
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
