import { MembershipRole, Prisma, PrismaClient } from '@prisma/client'

import { buildCreateClientDto, buildCreateProjectDto, buildCreateTaskDto } from '../builders/request.builders'

export async function addOrganizationMembership(
  prisma: PrismaClient,
  input: {
    userId: string
    organizationId: string
    role?: MembershipRole
  }
) {
  return prisma.membership.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role ?? MembershipRole.member
    }
  })
}

export async function createClientRecord(
  prisma: PrismaClient,
  input: {
    organizationId: string
    data?: Partial<Prisma.ClientUncheckedCreateInput>
  }
) {
  const defaults = buildCreateClientDto()

  return prisma.client.create({
    data: {
      organizationId: input.organizationId,
      name: defaults.name,
      email: defaults.email,
      companyName: defaults.companyName,
      status: defaults.status,
      ...input.data
    }
  })
}

export async function createProjectRecord(
  prisma: PrismaClient,
  input: {
    organizationId: string
    clientId: string
    data?: Partial<Omit<Prisma.ProjectUncheckedCreateInput, 'organizationId' | 'clientId'>>
  }
) {
  const defaults = buildCreateProjectDto(input.clientId)

  return prisma.project.create({
    data: {
      organizationId: input.organizationId,
      clientId: input.clientId,
      name: defaults.name,
      description: defaults.description,
      status: defaults.status,
      ...input.data
    }
  })
}

export async function createTaskRecord(
  prisma: PrismaClient,
  input: {
    organizationId: string
    projectId: string
    data?: Partial<Omit<Prisma.TaskUncheckedCreateInput, 'organizationId' | 'projectId' | 'title'>> & { title?: string }
  }
) {
  const defaults = buildCreateTaskDto(input.projectId)

  return prisma.task.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      title: defaults.title,
      description: defaults.description,
      assigneeUserId: defaults.assigneeUserId,
      status: defaults.status,
      priority: defaults.priority,
      dueDate: input.data?.dueDate,
      archivedAt: input.data?.archivedAt,
      ...input.data
    }
  })
}

export async function createProjectScenario(
  prisma: PrismaClient,
  input: {
    organizationId: string
    clientData?: Partial<Prisma.ClientUncheckedCreateInput>
    projectData?: Partial<Omit<Prisma.ProjectUncheckedCreateInput, 'organizationId' | 'clientId'>>
  }
) {
  const client = await createClientRecord(prisma, {
    organizationId: input.organizationId,
    data: input.clientData
  })

  const project = await createProjectRecord(prisma, {
    organizationId: input.organizationId,
    clientId: client.id,
    data: input.projectData
  })

  return {
    client,
    project
  }
}
