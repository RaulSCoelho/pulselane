import { requireServerSession } from '@/lib/auth/server-session'
import { Card } from '@heroui/react'

export default async function AppHomePage() {
  const me = await requireServerSession('/app')

  const organizationNames = me.memberships.map(membership => membership.organization.name).join(', ')

  return (
    <main className="flex min-h-screen bg-zinc-50 px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card className="border border-black/5 shadow-sm">
          <Card.Content className="flex flex-col gap-4 p-8">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500">Authenticated area</span>

              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Welcome, {me.name}</h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-sm text-zinc-500">Email</p>
                <p className="mt-1 font-medium text-zinc-950">{me.email}</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-sm text-zinc-500">Organizations</p>
                <p className="mt-1 font-medium text-zinc-950">{organizationNames}</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-zinc-600">
              This page exists only to validate the complete SSR auth flow before the operational screens.
            </p>
          </Card.Content>
        </Card>
      </div>
    </main>
  )
}
