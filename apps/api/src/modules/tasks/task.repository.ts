import { Injectable } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

type FindManyByOrganizationParams = {
  organizationId: string;
  projectId?: string;
  assigneeUserId?: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page: number;
  pageSize: number;
};

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.TaskInclude;

// Task payloads expose compact related objects so clients can render task lists
// without issuing extra lookups for project or assignee labels.
@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async create(
    data: Prisma.TaskCreateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).task.create({
      data,
      include: taskInclude,
    });
  }

  async findManyByOrganization(
    params: FindManyByOrganizationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const {
      organizationId,
      projectId,
      assigneeUserId,
      search,
      status,
      priority,
      page,
      pageSize,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.TaskWhereInput = {
      organizationId,
      projectId,
      assigneeUserId,
      status,
      priority,
      OR: search
        ? [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.getClient(tx).task.findMany({
        where,
        include: taskInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.getClient(tx).task.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  async findByIdAndOrganization(
    id: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).task.findFirst({
      where: {
        id,
        organizationId,
      },
      include: taskInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.TaskUpdateArgs['data'],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).task.update({
      where: {
        id,
      },
      data,
      include: taskInclude,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).task.delete({
      where: {
        id,
      },
    });
  }
}
