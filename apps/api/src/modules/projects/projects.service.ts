import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { UsagePolicyService } from '@/modules/billing/usage-policy.service'
import { ClientsService } from '@/modules/clients/clients.service'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, ClientStatus, Prisma, Project, ProjectStatus } from '@prisma/client'

import { CreateProjectDto } from './dto/requests/create-project.dto'
import { ListProjectsQueryDto } from './dto/requests/list-projects-query.dto'
import { UpdateProjectDto } from './dto/requests/update-project.dto'
import { ProjectRepository } from './project.repository'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectRepository: ProjectRepository,
    private readonly clientsService: ClientsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usagePolicyService: UsagePolicyService
  ) {}

  async create(actorUserId: string, organizationId: string, dto: CreateProjectDto, tx?: Prisma.TransactionClient) {
    const client = await this.clientsService.findOne(organizationId, dto.clientId, tx)

    if (client.status === ClientStatus.archived) {
      throw new BadRequestException('Cannot create a project for an archived client')
    }

    const status = dto.status ?? ProjectStatus.active

    const createProject = async (trx: Prisma.TransactionClient) => {
      await this.usagePolicyService.assertCanCreateProject(organizationId, trx)

      const project = await this.projectRepository.create(
        {
          organizationId,
          clientId: dto.clientId,
          name: dto.name,
          description: dto.description,
          status,
          archivedAt: status === ProjectStatus.archived ? new Date() : null
        },
        trx
      )

      await this.auditLog(project, actorUserId, organizationId, AuditLogAction.created, trx)

      return project
    }

    if (tx) {
      return createProject(tx)
    }

    return this.prisma.$transaction(trx => createProject(trx))
  }

  async findAll(organizationId: string, query: ListProjectsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    if (query.clientId) {
      await this.clientsService.findOne(organizationId, query.clientId, tx)
    }

    const { items, nextCursor, hasNextPage } = await this.projectRepository.findManyByOrganization(
      {
        organizationId,
        clientId: query.clientId,
        search: query.search,
        status: query.status,
        includeArchived: query.includeArchived,
        cursor: query.cursor,
        limit
      },
      tx
    )

    return {
      items,
      meta: {
        limit,
        nextCursor,
        hasNextPage
      }
    }
  }

  async findOne(organizationId: string, projectId: string, tx?: Prisma.TransactionClient) {
    const project = await this.projectRepository.findByIdAndOrganization(projectId, organizationId, tx)

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    return project
  }

  async update(
    actorUserId: string,
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
    tx?: Prisma.TransactionClient
  ) {
    const updateProject = async (trx: Prisma.TransactionClient) => {
      const currentProject = await this.getProjectOrThrow(projectId, organizationId, trx)
      const nextStatus = dto.status ?? currentProject.status
      const nextClientId = dto.clientId ?? currentProject.clientId
      const isUnarchiving = currentProject.status === ProjectStatus.archived && nextStatus !== ProjectStatus.archived
      const mustValidateTargetClient = dto.clientId !== undefined || isUnarchiving

      if (mustValidateTargetClient) {
        const client = await this.clientsService.findOne(organizationId, nextClientId, trx)

        if (client.status === ClientStatus.archived) {
          throw new BadRequestException('Cannot move a project to an archived client')
        }
      }

      if (isUnarchiving) {
        await this.usagePolicyService.assertCanCreateProject(organizationId, trx)
      }

      const project = await this.projectRepository.update(
        projectId,
        {
          ...dto,
          archivedAt: dto.status === undefined ? undefined : dto.status === ProjectStatus.archived ? new Date() : null
        },
        trx
      )

      await this.auditLog(project, actorUserId, organizationId, AuditLogAction.updated, trx)

      return project
    }

    if (tx) {
      return updateProject(tx)
    }

    return this.prisma.$transaction(trx => updateProject(trx))
  }

  async remove(actorUserId: string, organizationId: string, projectId: string, tx?: Prisma.TransactionClient) {
    await this.getProjectOrThrow(projectId, organizationId, tx)

    const project = await this.projectRepository.archive(projectId, tx)

    await this.auditLog(project, actorUserId, organizationId, AuditLogAction.archived, tx)

    return {
      success: true
    }
  }

  private async getProjectOrThrow(projectId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const project = await this.projectRepository.findByIdAndOrganization(projectId, organizationId, tx)

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    return project
  }

  private async auditLog(
    project: Project,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
    tx?: Prisma.TransactionClient
  ) {
    return this.auditLogsService.create(
      {
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
          archivedAt: project.archivedAt
        }
      },
      tx
    )
  }
}
