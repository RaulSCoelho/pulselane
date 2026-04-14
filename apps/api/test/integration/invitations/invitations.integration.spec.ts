import { describe } from 'vitest'

import { registerInvitationEmailMismatchCase } from './invitation-email-mismatch.case'
import { registerInvitationPlanLimitCreateCase } from './invitation-plan-limit-create.case'
import { registerInvitationRaceAcceptCase } from './invitation-race-accept.case'
import { registerInvitationRaceCreateCase } from './invitation-race-create.case'
import { registerInvitationResendCase } from './invitation-resend.case'
import { registerInvitationRevokeCase } from './invitation-revoke.case'
import { registerInvitationsFullFlowCase } from './invitations-full-flow.case'

describe('Invitations integration', () => {
  registerInvitationsFullFlowCase()
  registerInvitationEmailMismatchCase()
  registerInvitationRevokeCase()
  registerInvitationResendCase()
  registerInvitationRaceCreateCase()
  registerInvitationRaceAcceptCase()
  registerInvitationPlanLimitCreateCase()
})
