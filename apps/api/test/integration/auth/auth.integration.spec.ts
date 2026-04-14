import { describe } from 'vitest'

import { registerAuthConcurrentRefreshCase } from './concurrent-refresh.case'
import { registerAuthInvalidLoginCase } from './invalid-login.case'
import { registerAuthLogoutAllCase } from './logout-all.case'
import { registerAuthRefreshDeviceMismatchCase } from './refresh-device-mismatch.case'
import { registerAuthRefreshSessionsLogoutCase } from './refresh-sessions-logout.case'
import { registerAuthRefreshWithoutCookiesCase } from './refresh-without-cookies.case'
import { registerAuthSignupAndMeCase } from './signup-and-me.case'

describe('Auth integration', () => {
  registerAuthSignupAndMeCase()
  registerAuthRefreshSessionsLogoutCase()
  registerAuthConcurrentRefreshCase()
  registerAuthLogoutAllCase()
  registerAuthRefreshDeviceMismatchCase()
  registerAuthRefreshWithoutCookiesCase()
  registerAuthInvalidLoginCase()
})
