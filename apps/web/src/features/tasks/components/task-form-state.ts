export type TaskFormValues = {
  title: string
  projectId: string
  description: string
  assigneeUserId: string
  status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  blockedReason: string
  dueDate: string
}

export type TaskFieldErrors = Partial<Record<keyof TaskFormValues, string>>

export type TaskFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: TaskFormValues
  fieldErrors: TaskFieldErrors
  formKey: number
}

export type ArchiveTaskState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  archivedTaskId: string | null
}

export const initialTaskFormState: TaskFormState = {
  status: 'idle',
  message: null,
  fields: {
    title: '',
    projectId: '',
    description: '',
    assigneeUserId: '',
    status: 'todo',
    priority: 'medium',
    blockedReason: '',
    dueDate: ''
  },
  fieldErrors: {},
  formKey: 0
}

export const initialArchiveTaskState: ArchiveTaskState = {
  status: 'idle',
  message: null,
  archivedTaskId: null
}
