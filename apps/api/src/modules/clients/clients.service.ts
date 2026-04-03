import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientStatus } from '@prisma/client';
import { MembershipService } from '@/modules/membership/membership.service';
import { CreateClientDto } from './dto/requests/create-client.dto';
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto';
import { UpdateClientDto } from './dto/requests/update-client.dto';
import { ClientRepository } from './client.repository';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly membershipService: MembershipService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateClientDto) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    return this.clientRepository.create({
      organizationId,
      name: dto.name,
      email: dto.email,
      companyName: dto.companyName,
      status: dto.status ?? ClientStatus.active,
    });
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

    return this.clientRepository.update(clientId, dto);
  }

  async remove(userId: string, organizationId: string, clientId: string) {
    await this.membershipService.ensureUserIsMember(userId, organizationId);

    await this.ensureClientExists(clientId, organizationId);

    await this.clientRepository.delete(clientId);

    return {
      success: true,
    };
  }

  private async ensureClientExists(
    clientId: string,
    organizationId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findByIdAndOrganization(
      clientId,
      organizationId,
    );

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }
}
