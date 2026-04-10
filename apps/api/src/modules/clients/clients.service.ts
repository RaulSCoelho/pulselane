import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, Client, ClientStatus } from '@prisma/client';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { CreateClientDto } from './dto/requests/create-client.dto';
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto';
import { UpdateClientDto } from './dto/requests/update-client.dto';
import { ClientRepository } from './client.repository';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    actorUserId: string,
    organizationId: string,
    dto: CreateClientDto,
  ) {
    const status = dto.status ?? ClientStatus.active;

    const client = await this.clientRepository.create({
      organizationId,
      name: dto.name,
      email: dto.email,
      companyName: dto.companyName,
      status,
      archivedAt: status === ClientStatus.archived ? new Date() : null,
    });

    await this.auditLog(
      client,
      actorUserId,
      organizationId,
      AuditLogAction.created,
    );

    return client;
  }

  async findAll(organizationId: string, query: ListClientsQueryDto) {
    const limit = query.limit ?? 20;

    const { items, nextCursor, hasNextPage } =
      await this.clientRepository.findManyByOrganization({
        organizationId,
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

  async findOne(organizationId: string, clientId: string) {
    const client = await this.clientRepository.findByIdAndOrganization(
      clientId,
      organizationId,
    );

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    actorUserId: string,
    organizationId: string,
    clientId: string,
    dto: UpdateClientDto,
  ) {
    await this.ensureClientExists(clientId, organizationId);

    const client = await this.clientRepository.update(clientId, {
      ...dto,
      archivedAt:
        dto.status === undefined
          ? undefined
          : dto.status === ClientStatus.archived
            ? new Date()
            : null,
    });

    await this.auditLog(
      client,
      actorUserId,
      organizationId,
      AuditLogAction.updated,
    );

    return client;
  }

  async remove(actorUserId: string, organizationId: string, clientId: string) {
    await this.getClientOrThrow(clientId, organizationId);

    const client = await this.clientRepository.archive(clientId);

    await this.auditLog(
      client,
      actorUserId,
      organizationId,
      AuditLogAction.archived,
    );

    return {
      success: true,
    };
  }

  private async ensureClientExists(
    clientId: string,
    organizationId: string,
  ): Promise<void> {
    await this.getClientOrThrow(clientId, organizationId);
  }

  private async getClientOrThrow(clientId: string, organizationId: string) {
    const client = await this.clientRepository.findByIdAndOrganization(
      clientId,
      organizationId,
    );

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  private async auditLog(
    client: Client,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
  ) {
    return this.auditLogsService.create({
      organizationId,
      actorUserId,
      entityType: 'client',
      entityId: client.id,
      action,
      metadata: {
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        status: client.status,
        archivedAt: client.archivedAt,
      },
    });
  }
}
