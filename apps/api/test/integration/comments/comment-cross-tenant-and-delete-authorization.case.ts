import { MembershipRole } from '@prisma/client'
import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { addOrganizationMembership, createProjectScenario } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type {
  CommentResponse,
  CursorPageResponse,
  ErrorResponse,
  TaskResponse
} from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCommentCrossTenantAndDeleteAuthorizationCase(): void {
  it('should reject cross-tenant comment reads and writes for tasks from another organization', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'comments-cross-tenant-owner@example.com',
      organizationName: 'Comments Cross Tenant Workspace'
    })

    const foreignOwner = await createAuthenticatedUser(app, prisma, {
      email: 'comments-cross-tenant-foreign@example.com',
      organizationName: 'Foreign Comments Workspace'
    })

    const { project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId
    })

    const task = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Cross tenant comments task'
      }),
      201
    )

    const listResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/comments').query({
          taskId: task.body.id
        }),
        foreignOwner
      ),
      404
    )

    expect(listResponse.body.message).toBe('Task not found')

    const createResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/comments'), foreignOwner).send({
        taskId: task.body.id,
        body: 'Foreign org should not comment here'
      }),
      404
    )

    expect(createResponse.body.message).toBe('Task not found')
  })

  it('should reject non-author delete and allow owner delete for a comment in the same organization', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'comments-delete-owner@example.com',
      organizationName: 'Comments Delete Workspace'
    })

    const authorMember = await createAuthenticatedUser(app, prisma, {
      email: 'comments-delete-author@example.com',
      organizationName: 'Comments Delete Author Workspace'
    })

    const anotherMember = await createAuthenticatedUser(app, prisma, {
      email: 'comments-delete-another@example.com',
      organizationName: 'Comments Delete Another Workspace'
    })

    await addOrganizationMembership(prisma, {
      userId: authorMember.userId,
      organizationId: owner.organizationId,
      role: MembershipRole.member
    })

    await addOrganizationMembership(prisma, {
      userId: anotherMember.userId,
      organizationId: owner.organizationId,
      role: MembershipRole.member
    })

    const { project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId
    })

    const task = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Comment delete authorization task'
      }),
      201
    )

    const comment = await expectTyped<CommentResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/comments'), {
        accessToken: authorMember.accessToken,
        organizationId: owner.organizationId
      }).send({
        taskId: task.body.id,
        body: 'Author member comment'
      }),
      201
    )

    const forbiddenDelete = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`), {
        accessToken: anotherMember.accessToken,
        organizationId: owner.organizationId
      }),
      403
    )

    expect(forbiddenDelete.body.message).toBe('You do not have permission to delete this comment')

    await expectTyped<{ success: boolean }>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/comments/${comment.body.id}`), owner),
      200
    )

    const listedComments = await expectTyped<CursorPageResponse<CommentResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/comments').query({
          taskId: task.body.id
        }),
        owner
      ),
      200
    )

    expect(listedComments.body.items).toHaveLength(0)
  })
}
