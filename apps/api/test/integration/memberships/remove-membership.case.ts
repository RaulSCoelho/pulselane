import { AuditLogAction, MembershipRole, TaskPriority, TaskStatus } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

type SuccessResponse = {
  success: boolean
}

export function registerRemoveMembershipCase(): void {
  it('should remove membership, unassign tasks and create an audit log', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-remove-owner@example.com',
      organizationName: 'Remove Membership Workspace'
    })

    const memberUser = await createAuthenticatedUser(app, prisma, {
      email: 'memberships-remove-member@example.com',
      organizationName: 'Secondary Workspace'
    })

    const memberMembership = await prisma.membership.create({
      data: {
        organizationId: owner.organizationId,
        userId: memberUser.userId,
        role: MembershipRole.member
      }
    })

    const client = await prisma.client.create({
      data: {
        organizationId: owner.organizationId,
        name: 'Acme Corp'
      }
    })

    const project = await prisma.project.create({
      data: {
        organizationId: owner.organizationId,
        clientId: client.id,
        name: 'Migration Project'
      }
    })

    const task = await prisma.task.create({
      data: {
        organizationId: owner.organizationId,
        projectId: project.id,
        assigneeUserId: memberUser.userId,
        title: 'Assigned task',
        status: TaskStatus.todo,
        priority: TaskPriority.medium
      }
    })

    const response = await withOrgAuth(
      request(app.getHttpServer()).delete(`/api/memberships/${memberMembership.id}`),
      owner
    )

    expect(response.status).toBe(200)
    expect((response.body as SuccessResponse).success).toBe(true)

    const deletedMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: memberUser.userId,
          organizationId: owner.organizationId
        }
      }
    })

    expect(deletedMembership).toBeNull()

    const updatedTask = await prisma.task.findUniqueOrThrow({
      where: {
        id: task.id
      }
    })

    expect(updatedTask.assigneeUserId).toBeNull()

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        organizationId: owner.organizationId,
        actorUserId: owner.userId,
        entityType: 'membership',
        entityId: memberMembership.id,
        action: AuditLogAction.deleted
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    expect(auditLog).not.toBeNull()
    expect(auditLog?.metadata).toMatchObject({
      removedUserId: memberUser.userId,
      removedRole: MembershipRole.member,
      assigneePolicy: 'set_null',
      unassignedTasksCount: 1
    })
  })
}
