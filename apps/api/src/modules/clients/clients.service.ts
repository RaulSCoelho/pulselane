import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientStatus } from '@prisma/client';
import { CreateClientDto } from './dto/requests/create-client.dto';
import { ListClientsQueryDto } from './dto/requests/list-clients-query.dto';
import { UpdateClientDto } from './dto/requests/update-client.dto';
import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, organizationId: string, dto: CreateClientDto) {
    await this.assertMembership(userId, organizationId);

    return this.prisma.client.create({
      data: {
        organizationId,
        name: dto.name,
        email: dto.email,
        companyName: dto.companyName,
        status: dto.status ?? ClientStatus.active,
      },
    });
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: ListClientsQueryDto,
  ) {
    await this.assertMembership(userId, organizationId);

    return this.prisma.client.findMany({
      where: {
        organizationId,
        status: query.status,
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { companyName: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, organizationId: string, clientId: string) {
    await this.assertMembership(userId, organizationId);

    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
    });

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
    await this.assertMembership(userId, organizationId);

    await this.ensureClientExists(organizationId, clientId);

    return this.prisma.client.update({
      where: {
        id: clientId,
      },
      data: dto,
    });
  }

  async remove(userId: string, organizationId: string, clientId: string) {
    await this.assertMembership(userId, organizationId);

    await this.ensureClientExists(organizationId, clientId);

    await this.prisma.client.delete({
      where: {
        id: clientId,
      },
    });

    return {
      success: true,
    };
  }

  private async assertMembership(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not belong to this organization');
    }
  }

  private async ensureClientExists(
    organizationId: string,
    clientId: string,
  ): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }
}
