/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

describe('Tenant scoping and authorization integration', () => {
  it('should forbid access when x-organization-id belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: firstUserSignup } = await signupUser(app, {
      email: 'tenant-user-1@example.com',
      organizationName: 'Tenant Workspace One'
    })

    const { response: secondUserSignup } = await signupUser(app, {
      email: 'tenant-user-2@example.com',
      organizationName: 'Tenant Workspace Two'
    })

    const secondUserMe = await getCurrentUser(app, secondUserSignup.body.accessToken)
    const secondOrganizationId = secondUserMe.memberships[0].organization.id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).get('/api/clients'), {
        accessToken: firstUserSignup.body.accessToken,
        organizationId: secondOrganizationId
      }),
      403
    )

    expect(response.body.message).toBe('User is not a member of this organization')
  })

  it('should reject project creation when client belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerASignup } = await signupUser(app, {
      email: 'project-owner-a@example.com',
      organizationName: 'Project Workspace A'
    })

    const { response: ownerBSignup } = await signupUser(app, {
      email: 'project-owner-b@example.com',
      organizationName: 'Project Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerASignup.body.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerBSignup.body.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const clientResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
      accessToken: ownerBSignup.body.accessToken,
      organizationId: organizationBId
    })
      .send({
        name: 'Foreign Client'
      })
      .expect(201)

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), {
        accessToken: ownerASignup.body.accessToken,
        organizationId: organizationAId
      }).send({
        clientId: clientResponse.body.id,
        name: 'Invalid Cross-Tenant Project'
      }),
      404
    )

    expect(response.body.message).toBe('Client not found')
  })

  it('should reject task creation when assignee is not a member of the current organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'task-owner@example.com',
      organizationName: 'Task Workspace'
    })

    const { response: outsiderSignup } = await signupUser(app, {
      email: 'task-outsider@example.com',
      organizationName: 'Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const outsiderMe = await getCurrentUser(app, outsiderSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const clientResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        name: 'Task Client'
      })
      .expect(201)

    const projectResponse = await withOrgAuth(request(app.getHttpServer()).post('/api/projects'), {
      accessToken: ownerSignup.body.accessToken,
      organizationId
    })
      .send({
        clientId: clientResponse.body.id,
        name: 'Task Project'
      })
      .expect(201)

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        projectId: projectResponse.body.id,
        title: 'Cross-tenant assignee should fail',
        assigneeUserId: outsiderMe.id
      }),
      404
    )

    expect(response.body.message).toBe('Assignee not found in this organization')
  })

  it('should forbid admin from inviting an owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'invite-owner@example.com',
      organizationName: 'Invitations Workspace'
    })

    const { response: adminSignup } = await signupUser(app, {
      email: 'invite-admin@example.com',
      organizationName: 'Admin Personal Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const adminMe = await getCurrentUser(app, adminSignup.body.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id

    await prisma.membership.create({
      data: {
        userId: adminMe.id,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), {
        accessToken: adminSignup.body.accessToken,
        organizationId
      }).send({
        email: 'new-owner@example.com',
        role: 'owner'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot invite owners')
  })

  it('should forbid admin from updating an owner membership', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'membership-owner@example.com',
      organizationName: 'Membership Workspace'
    })

    const { response: adminSignup } = await signupUser(app, {
      email: 'membership-admin@example.com',
      organizationName: 'Membership Admin Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const adminMe = await getCurrentUser(app, adminSignup.body.accessToken)

    const organizationId = ownerMe.memberships[0].organization.id
    const ownerMembershipId = ownerMe.memberships[0].id

    await prisma.membership.create({
      data: {
        userId: adminMe.id,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${ownerMembershipId}/role`), {
        accessToken: adminSignup.body.accessToken,
        organizationId
      }).send({
        role: 'member'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot update owner memberships')
  })
})
