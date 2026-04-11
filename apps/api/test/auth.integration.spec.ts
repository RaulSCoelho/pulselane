/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import './helpers/test-env'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createTestApp } from './helpers/create-test-app'
import { setupTestDatabase, teardownTestDatabase } from './helpers/prisma-test-utils'

function extractCookies(setCookie: string | string[] | undefined): string[] {
  if (!setCookie) return []
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  return cookies.map(cookie => cookie.split(';')[0])
}

function replaceCookie(cookies: string[], cookieName: string, cookieValue: string): string[] {
  const targetPrefix = `${cookieName}=`

  return cookies.map(cookie => (cookie.startsWith(targetPrefix) ? `${cookieName}=${cookieValue}` : cookie))
}

describe('Auth integration', () => {
  let app: NestFastifyApplication
  let prisma: Awaited<ReturnType<typeof setupTestDatabase>>

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
    await teardownTestDatabase(prisma)
  })

  it('should signup, create organization membership and return current user', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Raul',
        email: 'raul@example.com',
        password: '123456',
        organizationName: 'Pulselane Labs'
      })
      .expect(201)

    expect(signupResponse.body.accessToken).toBeTypeOf('string')
    expect(signupResponse.headers['set-cookie']).toBeTruthy()

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signupResponse.body.accessToken}`)
      .expect(200)

    expect(meResponse.body.email).toBe('raul@example.com')
    expect(meResponse.body.memberships).toHaveLength(1)
    expect(meResponse.body.memberships[0].role).toBe('owner')
    expect(meResponse.body.memberships[0].organization.name).toBe('Pulselane Labs')
  })

  it('should refresh token, list sessions and revoke current session on logout', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Session User',
        email: 'session-user@example.com',
        password: '123456',
        organizationName: 'Session Workspace'
      })
      .expect(201)

    const initialAccessToken = signupResponse.body.accessToken as string
    const initialCookies = extractCookies(signupResponse.headers['set-cookie'])

    expect(initialAccessToken).toBeTypeOf('string')
    expect(initialCookies.length).toBeGreaterThan(0)

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialCookies)
      .expect(200)

    expect(refreshResponse.body.accessToken).toBeTypeOf('string')
    expect(refreshResponse.body.expiresIn).toBeTypeOf('number')

    const refreshedAccessToken = refreshResponse.body.accessToken as string

    const sessionsResponse = await request(app.getHttpServer())
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .expect(200)

    expect(Array.isArray(sessionsResponse.body)).toBe(true)
    expect(sessionsResponse.body).toHaveLength(1)
    expect(sessionsResponse.body[0].isCurrent).toBe(true)
    expect(sessionsResponse.body[0].isActive).toBe(true)
    expect(sessionsResponse.body[0].deviceId).toBeTypeOf('string')

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .expect(200)

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .expect(401)

    const user = await prisma.user.findUnique({
      where: {
        email: 'session-user@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user).not.toBeNull()
    expect(user?.authSessions).toHaveLength(1)
    expect(user?.authSessions[0].revokedAt).not.toBeNull()
  })

  it('should create multiple sessions and revoke all of them with logout-all', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Multi Session User',
        email: 'multi-session@example.com',
        password: '123456',
        organizationName: 'Multi Session Workspace'
      })
      .expect(201)

    const firstLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'multi-session@example.com',
        password: '123456'
      })
      .expect(200)

    const secondLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'multi-session@example.com',
        password: '123456'
      })
      .expect(200)

    const firstAccessToken = firstLogin.body.accessToken as string
    const secondAccessToken = secondLogin.body.accessToken as string

    const sessionsBeforeLogoutAll = await request(app.getHttpServer())
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${firstAccessToken}`)
      .expect(200)

    expect(sessionsBeforeLogoutAll.body).toHaveLength(3)

    await request(app.getHttpServer())
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${firstAccessToken}`)
      .expect(200)

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstAccessToken}`)
      .expect(401)

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(401)

    const user = await prisma.user.findUnique({
      where: {
        email: 'multi-session@example.com'
      },
      include: {
        authSessions: true
      }
    })

    expect(user).not.toBeNull()
    expect(user?.authSessions).toHaveLength(3)
    expect(user?.authSessions.every(session => session.revokedAt !== null)).toBe(true)
  })

  it('should reject refresh when device cookie does not match refresh token payload', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Device Mismatch User',
        email: 'device-mismatch@example.com',
        password: '123456',
        organizationName: 'Device Mismatch Workspace'
      })
      .expect(201)

    const cookies = extractCookies(signupResponse.headers['set-cookie'])
    const tamperedCookies = replaceCookie(cookies, 'device_id', 'tampered-device')

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', tamperedCookies)
      .expect(401)

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
    expect(response.body.message).toBe('Device ID mismatch')
  })

  it('should reject refresh without cookies', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/refresh').expect(401)

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
  })

  it('should reject login with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Login User',
        email: 'login-user@example.com',
        password: '123456',
        organizationName: 'Login Workspace'
      })
      .expect(201)

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'login-user@example.com',
        password: 'wrong-password'
      })
      .expect(401)

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
    expect(response.body.message).toBe('Invalid credentials')
  })
})
