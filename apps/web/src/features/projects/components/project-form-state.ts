export type ProjectFormValues = {
  name: string
  clientId: string
  description: string
  status: 'active' | 'on_hold' | 'completed' | 'archived'
}

export type ProjectFieldErrors = Partial<Record<keyof ProjectFormValues, string>>

export type ProjectFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: ProjectFormValues
  fieldErrors: ProjectFieldErrors
  formKey: number
}

export type ArchiveProjectState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  archivedProjectId: string | null
}

export const initialProjectFormState: ProjectFormState = {
  status: 'idle',
  message: null,
  fields: {
    name: '',
    clientId: '',
    description: '',
    status: 'active'
  },
  fieldErrors: {},
  formKey: 0
}

export const initialArchiveProjectState: ArchiveProjectState = {
  status: 'idle',
  message: null,
  archivedProjectId: null
}
