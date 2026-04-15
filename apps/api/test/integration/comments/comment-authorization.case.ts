import { MembershipRole } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { addOrganizationMembership, createProjectScenario } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CommentResponse, ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCommentAuthorizationCase(): void {
  it('should reject non-author member update and allow admin update', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'comments-auth-owner@example.com',
      organizationName: 'Comments Auth Workspace'
    })

    const member = await createAuthenticatedUser(app, prisma, {
      email: 'comments-auth-member@example.com',
      organizationName: 'Member Workspace'
    })

    const anotherMember = await createAuthenticatedUser(app, prisma, {
      email: 'comments-auth-another-member@example.com',
      organizationName: 'Another Member Workspace'
    })

    const admin = await createAuthenticatedUser(app, prisma, {
      email: 'comments-auth-admin@example.com',
      organizationName: 'Admin Workspace'
    })

    await addOrganizationMembership(prisma, {
      userId: member.userId,
      organizationId: owner.organizationId,
      role: MembershipRole.member
    })

    await addOrganizationMembership(prisma, {
      userId: anotherMember.userId,
      organizationId: owner.organizationId,
      role: MembershipRole.member
    })

    await addOrganizationMembership(prisma, {
      userId: admin.userId,
      organizationId: owner.organizationId,
      role: MembershipRole.admin
    })

    const { project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId
    })

    const task = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Task for comment authorization'
      }),
      201
    )

    const comment = await expectTyped<CommentResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/comments'), {
        accessToken: member.accessToken,
        organizationId: owner.organizationId
      }).send({
        taskId: task.body.id,
        body: 'Member authored comment'
      }),
      201
    )

    const forbiddenResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/comments/${comment.body.id}`), {
        accessToken: anotherMember.accessToken,
        organizationId: owner.organizationId
      }).send({
        body: 'Trying to edit another member comment'
      }),
      403
    )

    expect(forbiddenResponse.body.message).toBe('You do not have permission to edit this comment')

    const adminUpdated = await expectTyped<CommentResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/comments/${comment.body.id}`), {
        accessToken: admin.accessToken,
        organizationId: owner.organizationId
      }).send({
        body: 'Admin edited comment'
      }),
      200
    )

    expect(adminUpdated.body.body).toBe('Admin edited comment')
  })
}
