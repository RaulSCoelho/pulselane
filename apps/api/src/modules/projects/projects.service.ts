import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
import { ClientsService } from '@/modules/clients/clients.service';
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
  ) {}

  async create(userId: string, organizationId: string, dto: CreateProjectDto) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.clientsService.findOne(userId, organizationId, dto.clientId);

    return this.projectRepository.create({
      organizationId,
      clientId: dto.clientId,
      name: dto.name,
      description: dto.description,
      status: dto.status ?? ProjectStatus.active,
    });
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

    return this.projectRepository.update(projectId, dto);
  }

  async remove(userId: string, organizationId: string, projectId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);
    await this.ensureProjectExists(projectId, organizationId);

    await this.projectRepository.delete(projectId);

    return {
      success: true,
    };
  }

  private async ensureProjectExists(
    projectId: string,
    organizationId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findByIdAndOrganization(
      projectId,
      organizationId,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
