export const TEST_DEFAULTS = {
  password: '123456',
  userName: 'Raul',
  organizationName: 'Pulselane Workspace',
  clientName: 'Acme Corp',
  projectName: 'Website Redesign',
  taskTitle: 'Prepare proposal draft'
} as const

export const FREE_PLAN_LIMITS = {
  clients: 10,
  activeTasks: 100
} as const
