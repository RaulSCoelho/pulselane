export type OrganizationSettingsFormValues = {
  name: string
  slug: string
}

export type OrganizationSettingsFieldErrors = Partial<Record<keyof OrganizationSettingsFormValues, string>>

export type OrganizationSettingsFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: OrganizationSettingsFormValues
  fieldErrors: OrganizationSettingsFieldErrors
  formKey: number
}

export const initialOrganizationSettingsFormState: OrganizationSettingsFormState = {
  status: 'idle',
  message: null,
  fields: {
    name: '',
    slug: ''
  },
  fieldErrors: {},
  formKey: 0
}
