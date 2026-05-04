import { BILLING_PATH } from '@/lib/billing/billing-constants'
import { redirect } from 'next/navigation'

type LegacyBillingRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function buildBillingRedirectPath(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item)
        }
      }

      continue
    }

    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()

  return query ? `${BILLING_PATH}?${query}` : BILLING_PATH
}

export default async function LegacyBillingRedirectPage({ searchParams }: LegacyBillingRedirectPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  redirect(buildBillingRedirectPath(resolvedSearchParams))
}
