import { LOGIN_PATH, SIGNUP_PATH } from '@/lib/auth/auth-constants'
import { getAuthSession } from '@/lib/auth/auth-session'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Card, buttonVariants } from '@heroui/react'
import Link from 'next/link'

const featureCards = [
  {
    eyebrow: 'Clients',
    title: 'Centralize the client operation',
    description:
      'Keep every client record in one place instead of spreading operational data across spreadsheets, documents, and chat threads.'
  },
  {
    eyebrow: 'Projects',
    title: 'Connect delivery to each client',
    description:
      'Organize projects per client with a structure ready for real operational work, not a fake demo hierarchy.'
  },
  {
    eyebrow: 'Tasks',
    title: 'Track ownership and execution',
    description:
      'Assign work, control status, define priority, and make operational execution visible across the organization.'
  },
  {
    eyebrow: 'Auditability',
    title: 'Keep a reliable activity trail',
    description:
      'Create a system that is explainable in interviews and defensible in production-like scenarios: auth, roles, audit logs, limits and organization context.'
  }
]

const proofPoints = [
  'Multi-tenant by organization',
  'Role-based access by membership',
  'Clients → projects → tasks flow',
  'Billing and plan limits ready',
  'Operational traceability',
  'Session-based auth flow'
]

const workflowSteps = [
  {
    title: 'Start with a real workspace',
    description:
      'Create the account, get an organization automatically, and enter the product without manual bootstrap.'
  },
  {
    title: 'Select the active organization',
    description: 'Pulselane treats organization context as a first-class part of the product, not as an afterthought.'
  },
  {
    title: 'Run the operation',
    description: 'Manage clients, connect projects, and execute tasks with clear ownership and less fragmentation.'
  }
]

export async function PublicHomePage() {
  const session = await getAuthSession()

  const primaryHref = session?.accessToken ? CLIENTS_PATH : SIGNUP_PATH
  const primaryLabel = session?.accessToken ? 'Open workspace' : 'Start with Pulselane'
  const secondaryHref = session?.accessToken ? APP_HOME_PATH : LOGIN_PATH
  const secondaryLabel = session?.accessToken ? 'Go to overview' : 'Sign in'

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),transparent)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-8 sm:py-10 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Pulselane</span>
            <p className="text-sm text-zinc-600">Operational SaaS for clients, projects and execution flow</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={LOGIN_PATH} className={buttonVariants({ variant: 'ghost', size: 'md' })}>
              Sign in
            </Link>

            <Link href={primaryHref} className={buttonVariants({ variant: 'primary', size: 'md' })}>
              {primaryLabel}
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_420px] lg:items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <span className="inline-flex w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                Replace fragmented operations with one structured product
              </span>

              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
                  Manage clients, projects and execution without turning operations into spreadsheet chaos.
                </h1>

                <p className="max-w-3xl text-lg leading-8 text-zinc-600">
                  Pulselane is built for teams that need client visibility, project structure, task ownership and
                  organization-scoped access in a single product. It is not a dashboard toy. It is an operational
                  foundation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryHref} className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                {primaryLabel}
              </Link>

              <Link href={secondaryHref} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                {secondaryLabel}
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {proofPoints.map(item => (
                <div
                  key={item}
                  className="rounded-2xl border border-black/5 bg-white/85 px-4 py-4 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="border border-black/5 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur">
            <Card.Header className="flex flex-col gap-3 p-8 pb-0">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Why it converts</span>
              <Card.Title className="text-3xl font-semibold tracking-tight text-zinc-950">
                Built around operational clarity
              </Card.Title>
              <Card.Description className="text-sm leading-6 text-zinc-600">
                The product exists to replace disconnected client tracking, project context loss, and task execution
                without ownership.
              </Card.Description>
            </Card.Header>

            <Card.Content className="flex flex-col gap-4 p-8">
              <div className="rounded-2xl border border-black/5 bg-zinc-50 p-5">
                <p className="text-sm font-medium text-zinc-500">What gets fixed</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">
                  <li>Scattered spreadsheets for client control</li>
                  <li>Projects disconnected from the customer context</li>
                  <li>Tasks without ownership, priority or traceability</li>
                  <li>Weak multi-tenant boundaries in internal tools</li>
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Multi-tenant</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    Organization context is treated as a core product rule, not a frontend-only convenience.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Growth-ready</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    The architecture already leaves room for plan limits, billing and stricter operational governance.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Core capabilities</span>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
            The product already communicates a serious operational model
          </h2>
          <p className="max-w-3xl text-base leading-7 text-zinc-600">
            This is the shape of a real B2B product: tenant isolation, authenticated workspace, organization context,
            controlled access and operational entities that evolve in a coherent chain.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(card => (
            <Card key={card.title} variant="secondary" className="border border-black/5 shadow-sm">
              <Card.Header className="flex flex-col gap-2 p-6 pb-0">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                  {card.eyebrow}
                </span>
                <Card.Title className="text-xl font-semibold tracking-tight text-zinc-950">{card.title}</Card.Title>
              </Card.Header>

              <Card.Content className="p-6 pt-4">
                <p className="text-sm leading-6 text-zinc-600">{card.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-6 lg:px-8 lg:py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card key={step.title} className="border border-black/5 shadow-sm">
              <Card.Header className="flex flex-col gap-3 p-6 pb-0">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <Card.Title className="text-xl font-semibold tracking-tight text-zinc-950">{step.title}</Card.Title>
              </Card.Header>

              <Card.Content className="p-6 pt-4">
                <p className="text-sm leading-6 text-zinc-600">{step.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8 lg:py-12">
        <Card className="border border-black/5 bg-zinc-950 text-white shadow-xl shadow-zinc-950/20">
          <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="flex max-w-3xl flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Ready to explore
              </span>
              <h2 className="text-3xl font-semibold tracking-tight">
                Stop operating through disconnected tools and start with a workspace that has architectural discipline.
              </h2>
              <p className="text-sm leading-7 text-zinc-300">
                Use the public entry to understand the value proposition, then enter the authenticated workspace and
                move directly into the client operation flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryHref} className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                {primaryLabel}
              </Link>

              <Link
                href={secondaryHref}
                className={
                  buttonVariants({ variant: 'outline', size: 'lg' }) + ' border-white/20 text-white hover:bg-white/10'
                }
              >
                {secondaryLabel}
              </Link>
            </div>
          </Card.Content>
        </Card>
      </section>
    </main>
  )
}
