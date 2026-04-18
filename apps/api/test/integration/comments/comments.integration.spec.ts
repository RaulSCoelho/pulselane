import { describe } from 'vitest'

import { registerCommentAuthorizationCase } from './comment-authorization.case'
import { registerCommentCrossTenantAndDeleteAuthorizationCase } from './comment-cross-tenant-and-delete-authorization.case'
import { registerCommentsCrudHistoryCase } from './comments-crud-history.case'

describe('Comments integration', () => {
  registerCommentsCrudHistoryCase()
  registerCommentAuthorizationCase()
  registerCommentCrossTenantAndDeleteAuthorizationCase()
})
