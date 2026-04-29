export type BillingRedirectActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  redirectUrl: string | null
  actionKey: string | null
}

export const initialBillingRedirectActionState: BillingRedirectActionState = {
  status: 'idle',
  message: null,
  redirectUrl: null,
  actionKey: null
}
