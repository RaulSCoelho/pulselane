import { PrismaService } from '@/infra/prisma/prisma.service'
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service'
import { UsagePolicyService } from '@/modules/billing/usage-policy.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { AuditLogAction, Client, ClientStatus, Prisma } from '@prisma/client'

import { ClientRepository } from './client.repository'
import { CreateClientDto } from './dto/requests/create-client.dto'
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto'
import { UpdateClientDto } from './dto/requests/update-client.dto'

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientRepository: ClientRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly usagePolicyService: UsagePolicyService
  ) {}

  async create(actorUserId: string, organizationId: string, dto: CreateClientDto, tx?: Prisma.TransactionClient) {
    const status = dto.status ?? ClientStatus.active

    const createClient = async (trx: Prisma.TransactionClient) => {
      await this.usagePolicyService.assertCanCreateClient(organizationId, trx)

      const client = await this.clientRepository.create(
        {
          organizationId,
          name: dto.name,
          email: dto.email,
          companyName: dto.companyName,
          status,
          archivedAt: status === ClientStatus.archived ? new Date() : null
        },
        trx
      )

      await this.auditLog(client, actorUserId, organizationId, AuditLogAction.created, trx)

      return client
    }

    if (tx) {
      return createClient(tx)
    }

    return this.prisma.$transaction(trx => createClient(trx))
  }

  async findAll(organizationId: string, query: ListClientsQueryDto, tx?: Prisma.TransactionClient) {
    const limit = query.limit ?? 20

    const { items, nextCursor, hasNextPage } = await this.clientRepository.findManyByOrganization(
      {
        organizationId,
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

  async findOne(organizationId: string, clientId: string, tx?: Prisma.TransactionClient) {
    const client = await this.clientRepository.findByIdAndOrganization(clientId, organizationId, tx)

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    return client
  }

  async update(
    actorUserId: string,
    organizationId: string,
    clientId: string,
    dto: UpdateClientDto,
    tx?: Prisma.TransactionClient
  ) {
    await this.ensureClientExists(clientId, organizationId, tx)

    const client = await this.clientRepository.update(
      clientId,
      {
        ...dto,
        archivedAt: dto.status === undefined ? undefined : dto.status === ClientStatus.archived ? new Date() : null
      },
      tx
    )

    await this.auditLog(client, actorUserId, organizationId, AuditLogAction.updated, tx)

    return client
  }

  async remove(actorUserId: string, organizationId: string, clientId: string, tx?: Prisma.TransactionClient) {
    await this.getClientOrThrow(clientId, organizationId, tx)

    const client = await this.clientRepository.archive(clientId, tx)

    await this.auditLog(client, actorUserId, organizationId, AuditLogAction.archived, tx)

    return {
      success: true
    }
  }

  private async ensureClientExists(
    clientId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    await this.getClientOrThrow(clientId, organizationId, tx)
  }

  private async getClientOrThrow(clientId: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const client = await this.clientRepository.findByIdAndOrganization(clientId, organizationId, tx)

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    return client
  }

  private async auditLog(
    client: Client,
    actorUserId: string,
    organizationId: string,
    action: AuditLogAction,
    tx?: Prisma.TransactionClient
  ) {
    return this.auditLogsService.create(
      {
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
          archivedAt: client.archivedAt
        }
      },
      tx
    )
  }
}
