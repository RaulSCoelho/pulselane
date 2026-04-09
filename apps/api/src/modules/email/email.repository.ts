import { Injectable } from '@nestjs/common';
import { EmailDeliveryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyParams = {
  organizationId: string;
  page: number;
  pageSize: number;
  to?: string;
  status?: EmailDeliveryStatus;
};

const emailDeliveryInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.EmailDeliveryInclude;

@Injectable()
export class EmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.EmailDeliveryCreateArgs['data']) {
    return this.prisma.emailDelivery.create({
      data,
      include: emailDeliveryInclude,
    });
  }

  async update(id: string, data: Prisma.EmailDeliveryUpdateArgs['data']) {
    return this.prisma.emailDelivery.update({
      where: { id },
      data,
      include: emailDeliveryInclude,
    });
  }

  async findMany(params: FindManyParams) {
    const { organizationId, page, pageSize, to, status } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmailDeliveryWhereInput = {
      organizationId,
      status,
      to: to ? { contains: to, mode: 'insensitive' } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.emailDelivery.findMany({
        where,
        include: emailDeliveryInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.emailDelivery.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }
}
