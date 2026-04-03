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
    const client = await this.clientRepository.create({
      organizationId,
      name: dto.name,
      email: dto.email,
      companyName: dto.companyName,
      status: dto.status ?? ClientStatus.active,
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
    return this.clientRepository.findManyByOrganization({
      organizationId,
      search: query.search,
      status: query.status,
    });
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

    const client = await this.clientRepository.update(clientId, dto);

    await this.auditLog(
      client,
      actorUserId,
      organizationId,
      AuditLogAction.updated,
    );

    return client;
  }

  async remove(actorUserId: string, organizationId: string, clientId: string) {
    const client = await this.getClientOrThrow(clientId, organizationId);

    await this.clientRepository.delete(clientId);

    await this.auditLog(
      client,
      actorUserId,
      organizationId,
      AuditLogAction.deleted,
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
      },
    });
  }
}
