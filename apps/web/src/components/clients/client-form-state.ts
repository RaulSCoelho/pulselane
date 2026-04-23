export type ClientFormValues = {
  name: string
  email: string
  companyName: string
  status: 'active' | 'inactive' | 'archived'
}

export type ClientFieldErrors = Partial<Record<keyof ClientFormValues, string>>

export type ClientFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: ClientFormValues
  fieldErrors: ClientFieldErrors
  formKey: number
}

export type ArchiveClientState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  archivedClientId: string | null
}

export const initialClientFormState: ClientFormState = {
  status: 'idle',
  message: null,
  fields: {
    name: '',
    email: '',
    companyName: '',
    status: 'active'
  },
  fieldErrors: {},
  formKey: 0
}

export const initialArchiveClientState: ArchiveClientState = {
  status: 'idle',
  message: null,
  archivedClientId: null
}
