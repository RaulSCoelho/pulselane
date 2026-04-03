import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, Client, ClientStatus } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { CreateClientDto } from './dto/requests/create-client.dto';
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto';
import { UpdateClientDto } from './dto/requests/update-client.dto';
import { ClientRepository } from './client.repository';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly membershipService: MembershipService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateClientDto) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    const client = await this.clientRepository.create({
      organizationId,
      name: dto.name,
      email: dto.email,
      companyName: dto.companyName,
      status: dto.status ?? ClientStatus.active,
    });

    await this.auditLog(client, userId, organizationId, AuditLogAction.created);

    return client;
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: ListClientsQueryDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    return this.clientRepository.findManyByOrganization({
      organizationId,
      search: query.search,
      status: query.status,
    });
  }

  async findOne(userId: string, organizationId: string, clientId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

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
    userId: string,
    organizationId: string,
    clientId: string,
    dto: UpdateClientDto,
  ) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    await this.ensureClientExists(clientId, organizationId);

    const client = await this.clientRepository.update(clientId, dto);

    await this.auditLog(client, userId, organizationId, AuditLogAction.updated);

    return client;
  }

  async remove(userId: string, organizationId: string, clientId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    const client = await this.getClientOrThrow(clientId, organizationId);

    await this.clientRepository.delete(clientId);

    await this.auditLog(client, userId, organizationId, AuditLogAction.deleted);

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
    userId: string,
    organizationId: string,
    action: AuditLogAction,
  ) {
    return this.auditLogsService.create({
      organizationId,
      actorUserId: userId,
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
