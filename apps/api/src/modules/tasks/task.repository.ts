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
    } = params;

    return this.getClient(tx).task.findMany({
      where: {
        organizationId,
        projectId,
        assigneeUserId,
        status,
        priority,
        OR: search
          ? ['title', 'description'].map((field) => ({
              [field]: { contains: search, mode: 'insensitive' },
            }))
          : undefined,
      },
      include: taskInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
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
