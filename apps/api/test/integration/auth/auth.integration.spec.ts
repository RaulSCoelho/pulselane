import { describe } from 'vitest'

import { registerAuthConcurrentRefreshCase } from './concurrent-refresh.case'
import { registerAuthConcurrentSignupSameOrgNameCase } from './concurrent-signup-same-org-name.case'
import { registerAuthInvalidLoginCase } from './invalid-login.case'
import { registerAuthLogoutAllCase } from './logout-all.case'
import { registerAuthRefreshDeviceMismatchCase } from './refresh-device-mismatch.case'
import { registerAuthRefreshSessionsLogoutCase } from './refresh-sessions-logout.case'
import { registerAuthRefreshTokenReuseCompromisesSessionCase } from './refresh-token-reuse-compromises-session.case'
import { registerAuthRefreshWithoutCookiesCase } from './refresh-without-cookies.case'
import { registerAuthSignupAndMeCase } from './signup-and-me.case'

describe('Auth integration', () => {
  registerAuthSignupAndMeCase()
  registerAuthConcurrentSignupSameOrgNameCase()
  registerAuthRefreshSessionsLogoutCase()
  registerAuthConcurrentRefreshCase()
  registerAuthRefreshTokenReuseCompromisesSessionCase()
  registerAuthLogoutAllCase()
  registerAuthRefreshDeviceMismatchCase()
  registerAuthRefreshWithoutCookiesCase()
  registerAuthInvalidLoginCase()
})
