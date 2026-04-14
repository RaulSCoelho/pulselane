import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createAuthenticatedUser, getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type MembershipItem = {
  id: string
  role: string
  user: {
    id: string
    email: string
    name: string
  }
}

describe('Memberships integration', () => {
  it('should paginate memberships with cursor, filter memberships, and update role as owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner@example.com'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const thirdUser = await prisma.user.create({
      data: {
        name: 'Viewer User',
        email: 'viewer@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const membershipToUpdate = await prisma.membership.create({
      data: {
        userId: secondUser.id,
        organizationId,
        role: 'member'
      }
    })

    await prisma.membership.create({
      data: {
        userId: thirdUser.id,
        organizationId,
        role: 'viewer'
      }
    })

    const firstPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/memberships').query({ limit: 2 }), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      200
    )

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/memberships')
          .query({
            limit: 2,
            cursor: firstPage.body.meta.nextCursor ?? ''
          }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/memberships').query({
          limit: 10,
          search: 'member',
          role: 'member'
        }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(filteredPage.body.items).toHaveLength(1)
    expect(filteredPage.body.items[0].user.email).toBe('member@example.com')
    expect(filteredPage.body.items[0].role).toBe('member')

    const updateResponse = await expectTyped<MembershipItem>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${membershipToUpdate.id}/role`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      200
    )

    expect(updateResponse.body.role).toBe('admin')
    expect(updateResponse.body.user.email).toBe('member@example.com')
  })

  it('should reject demoting the last owner of the organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'single-owner@example.com',
      organizationName: 'Single Owner Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id
    const ownerMembershipId = me.memberships[0].id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${ownerMembershipId}/role`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      403
    )

    expect(response.body.message).toBe('Owner cannot remove own owner role')
  })

  it('should reject demoting another owner when they are the last owner remaining besides self after concurrency lock check', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-a@example.com',
      organizationName: 'Owner Count Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondOwnerUser = await prisma.user.create({
      data: {
        name: 'Second Owner',
        email: 'owner-b@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const secondOwnerMembership = await prisma.membership.create({
      data: {
        userId: secondOwnerUser.id,
        organizationId,
        role: 'owner'
      }
    })

    await expectTyped<MembershipItem>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${secondOwnerMembership.id}/role`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      200
    )

    const updatedActorMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId: me.id
      }
    })

    expect(updatedActorMembership).not.toBeNull()
    expect(updatedActorMembership?.role).toBe('owner')

    const updatedSecondOwnerMembership = await prisma.membership.findUnique({
      where: {
        id: secondOwnerMembership.id
      }
    })

    expect(updatedSecondOwnerMembership).not.toBeNull()
    expect(updatedSecondOwnerMembership?.role).toBe('admin')
  })

  it('should reject admin promoting a membership to owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'owner-promote@example.com',
      organizationName: 'Admin Promote Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const memberUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member-promote@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const adminMembership = await prisma.membership.create({
      data: {
        userId: adminUser.id,
        organizationId,
        role: 'admin'
      }
    })

    const memberMembership = await prisma.membership.create({
      data: {
        userId: memberUser.id,
        organizationId,
        role: 'member'
      }
    })

    const adminLogin = await createAuthenticatedUser(app, prisma, {
      email: 'admin-promote-login@example.com',
      organizationName: 'Temporary Workspace'
    })

    await prisma.membership.deleteMany({
      where: {
        userId: adminLogin.userId
      }
    })

    await prisma.membership.create({
      data: {
        userId: adminLogin.userId,
        organizationId,
        role: 'admin'
      }
    })

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${memberMembership.id}/role`), {
        accessToken: adminLogin.accessToken,
        organizationId
      }).send({
        role: 'owner'
      }),
      403
    )

    expect(response.body.message).toBe('Admins cannot assign owner role')

    const persistedAdminMembership = await prisma.membership.findUnique({
      where: {
        id: adminMembership.id
      }
    })

    expect(persistedAdminMembership).not.toBeNull()
    expect(persistedAdminMembership?.role).toBe('admin')
  })
})
