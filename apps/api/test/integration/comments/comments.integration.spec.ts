import { describe } from 'vitest'

import { registerCommentAuthorizationCase } from './comment-authorization.case'
import { registerCommentsCrudHistoryCase } from './comments-crud-history.case'

describe('Comments integration', () => {
  registerCommentsCrudHistoryCase()
  registerCommentAuthorizationCase()
})
