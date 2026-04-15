import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { createProjectScenario } from '../../support/factories/domain.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type {
  CommentActivityHistoryItemResponse,
  CommentResponse,
  CursorPageResponse,
  TaskResponse
} from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerCommentsCrudHistoryCase(): void {
  it('should create, list, update, soft delete comments and expose minimal task activity history', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'comments-owner@example.com',
      organizationName: 'Comments Workspace'
    })

    const { project } = await createProjectScenario(prisma, {
      organizationId: owner.organizationId
    })

    const task = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: project.id,
        title: 'Task with comments'
      }),
      201
    )

    const createdComment = await expectTyped<CommentResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/comments'), owner).send({
        taskId: task.body.id,
        body: 'Initial operational note'
      }),
      201
    )

    expect(createdComment.body.body).toBe('Initial operational note')
    expect(createdComment.body.author.id).toBe(owner.userId)

    const listedComments = await expectTyped<CursorPageResponse<CommentResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/comments').query({ taskId: task.body.id }), owner),
      200
    )

    expect(listedComments.body.items).toHaveLength(1)
    expect(listedComments.body.items[0].id).toBe(createdComment.body.id)

    const updatedComment = await expectTyped<CommentResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/comments/${createdComment.body.id}`), owner).send({
        body: 'Updated operational note'
      }),
      200
    )

    expect(updatedComment.body.body).toBe('Updated operational note')

    await expectTyped<{ success: boolean }>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/comments/${createdComment.body.id}`), owner),
      200
    )

    const listedAfterDelete = await expectTyped<CursorPageResponse<CommentResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/comments').query({ taskId: task.body.id }), owner),
      200
    )

    expect(listedAfterDelete.body.items).toHaveLength(0)

    const activityHistory = await expectTyped<CursorPageResponse<CommentActivityHistoryItemResponse>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/comments/activity-history').query({ taskId: task.body.id }),
        owner
      ),
      200
    )

    const actions = activityHistory.body.items.map(item => item.action)

    expect(actions).toContain('comment_created')
    expect(actions).toContain('comment_updated')
    expect(actions).toContain('comment_deleted')
    expect(actions).toContain('task_created')
  })
}
