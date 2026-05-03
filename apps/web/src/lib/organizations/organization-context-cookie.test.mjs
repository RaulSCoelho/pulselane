import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { ACTIVE_ORGANIZATION_COOKIE_NAME } from './organization-context-constants.ts'
import { clearActiveOrganizationCookie, setActiveOrganizationCookie } from './organization-context-cookie.ts'

function createCookieRecorder() {
  const calls = []

  return {
    calls,
    response: {
      cookies: {
        set(options) {
          calls.push(options)
        }
      }
    }
  }
}

test('clears the active organization cookie at the session boundary', () => {
  const recorder = createCookieRecorder()

  clearActiveOrganizationCookie(recorder.response)

  assert.deepEqual(recorder.calls, [
    {
      name: ACTIVE_ORGANIZATION_COOKIE_NAME,
      value: '',
      maxAge: 0,
      sameSite: 'lax',
      path: '/'
    }
  ])
})

test('sets the active organization cookie with the shared cookie policy', () => {
  const recorder = createCookieRecorder()

  setActiveOrganizationCookie(recorder.response, 'org-1')

  assert.equal(recorder.calls[0].name, ACTIVE_ORGANIZATION_COOKIE_NAME)
  assert.equal(recorder.calls[0].value, 'org-1')
  assert.equal(recorder.calls[0].sameSite, 'lax')
  assert.equal(recorder.calls[0].path, '/')
  assert.equal(recorder.calls[0].maxAge > 0, true)
})

test('auth routes clear the active organization cookie so it cannot leak into the next login', () => {
  const routeFiles = [
    'src/app/api/v1/auth/logout/route.ts',
    'src/app/api/v1/auth/logout-all/route.ts',
    'src/app/api/v1/auth/login/route.ts',
    'src/app/api/v1/auth/signup/route.ts'
  ]

  for (const routeFile of routeFiles) {
    const content = readFileSync(routeFile, 'utf8')

    assert.equal(
      content.includes('clearActiveOrganizationCookie(response)'),
      true,
      `${routeFile} must clear active organization context`
    )
  }
})

test('client auth and organization-switch flows clear React Query cache', () => {
  const clientFiles = [
    'src/components/app/app-shell.tsx',
    'src/features/sessions/components/session-logout-buttons.tsx',
    'src/features/auth/components/login-form.tsx',
    'src/features/auth/components/signup-form.tsx',
    'src/features/organizations/components/organization-selector-form.tsx'
  ]

  for (const clientFile of clientFiles) {
    const content = readFileSync(clientFile, 'utf8')

    assert.equal(content.includes('queryClient.clear()'), true, `${clientFile} must clear client query cache`)
  }
})
