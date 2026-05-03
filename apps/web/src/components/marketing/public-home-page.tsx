import { BrandLogo } from '@/components/brand/brand-logo'
import { LOGIN_PATH, SIGNUP_PATH } from '@/lib/auth/auth-constants'
import { getAuthSession } from '@/lib/auth/auth-session'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Card, buttonVariants } from '@heroui/react'
import heroVisual from '@pulselane/assets/placeholder-tech-layout-wide.png'
import Image from 'next/image'
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
  'Clients -> projects -> tasks flow',
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
    <main className="bg-background text-foreground">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <BrandLogo className="h-auto max-w-44" priority />
            <p className="text-sm text-muted">Operational SaaS for clients, projects and execution flow</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
            <Link href={LOGIN_PATH} className={`${buttonVariants({ variant: 'ghost', size: 'md' })} w-full sm:w-auto`}>
              Sign in
            </Link>

            <Link
              href={primaryHref}
              className={`${buttonVariants({ variant: 'primary', size: 'md' })} w-full sm:w-auto`}
            >
              {primaryLabel}
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_420px] lg:items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <span className="inline-flex w-fit rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
                Replace fragmented operations with one structured product
              </span>

              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl font-brand tracking-normal text-foreground">
                  Manage clients, projects and execution without turning operations into spreadsheet chaos.
                </h1>

                <p className="max-w-3xl text-sm leading-6 text-muted">
                  Pulselane is built for teams that need client visibility, project structure, task ownership and
                  organization-scoped access in a single product. It is not a dashboard toy. It is an operational
                  foundation.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={primaryHref}
                className={`${buttonVariants({ variant: 'primary', size: 'lg' })} w-full sm:w-auto`}
              >
                {primaryLabel}
              </Link>

              <Link
                href={secondaryHref}
                className={`${buttonVariants({ variant: 'outline', size: 'lg' })} w-full sm:w-auto`}
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {proofPoints.map(item => (
                <div
                  key={item}
                  className="rounded-lg border border-border bg-surface px-4 py-4 text-sm font-medium text-foreground shadow-surface"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="min-w-0 overflow-hidden border border-border bg-surface shadow-surface">
            <Image
              src={heroVisual}
              alt=""
              priority
              sizes="(min-width: 1024px) 420px, 100vw"
              className="aspect-video w-full border-b border-separator object-cover"
              aria-hidden="true"
            />
            <Card.Header className="flex min-w-0 flex-col gap-3 p-5 pb-0 sm:p-8 sm:pb-0">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Why it converts</span>
              <Card.Title className="font-semibold tracking-normal text-foreground">
                Built around operational clarity
              </Card.Title>
              <Card.Description className="text-sm leading-6 text-muted">
                The product exists to replace disconnected client tracking, project context loss, and task execution
                without ownership.
              </Card.Description>
            </Card.Header>

            <Card.Content className="flex min-w-0 flex-col gap-4 p-5 sm:p-8">
              <div className="rounded-lg border border-border bg-surface-secondary p-5">
                <p className="text-sm font-medium text-muted">What gets fixed</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground">
                  <li>Scattered spreadsheets for client control</li>
                  <li>Projects disconnected from the customer context</li>
                  <li>Tasks without ownership, priority or traceability</li>
                  <li>Weak multi-tenant boundaries in internal tools</li>
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Multi-tenant</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    Organization context is treated as a core product rule, not a frontend-only convenience.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Growth-ready</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    The architecture already leaves room for plan limits, billing and stricter operational governance.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Core capabilities</span>
          <h2 className="font-semibold tracking-normal text-foreground">
            The product already communicates a serious operational model
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            This is the shape of a real B2B product: tenant isolation, authenticated workspace, organization context,
            controlled access and operational entities that evolve in a coherent chain.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(card => (
            <Card key={card.title} variant="secondary" className="min-w-0 border border-border shadow-surface">
              <Card.Header className="flex min-w-0 flex-col gap-2 p-5 pb-0 sm:p-6 sm:pb-0">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
                  {card.eyebrow}
                </span>
                <Card.Title className="text-xl font-medium tracking-normal text-foreground">{card.title}</Card.Title>
              </Card.Header>

              <Card.Content className="p-5 pt-4 sm:p-6 sm:pt-4">
                <p className="text-sm leading-6 text-muted">{card.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card key={step.title} className="min-w-0 border border-border shadow-surface">
              <Card.Header className="flex min-w-0 flex-col gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-dark-background text-sm font-semibold text-brand-light-text">
                  {index + 1}
                </span>
                <Card.Title className="text-xl font-medium tracking-normal text-foreground">{step.title}</Card.Title>
              </Card.Header>

              <Card.Content className="p-5 pt-4 sm:p-6 sm:pt-4">
                <p className="text-sm leading-6 text-muted">{step.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Card className="min-w-0 border border-brand-dark-border bg-brand-dark-background text-brand-light-text shadow-surface">
          <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="flex max-w-3xl min-w-0 flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan">
                Ready to explore
              </span>
              <h2 className="font-semibold tracking-normal">
                Stop operating through disconnected tools and start with a workspace that has architectural discipline.
              </h2>
              <p className="text-sm leading-6 text-brand-light-text/75">
                Use the public entry to understand the value proposition, then enter the authenticated workspace and
                move directly into the client operation flow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={primaryHref}
                className={`${buttonVariants({ variant: 'primary', size: 'lg' })} w-full sm:w-auto`}
              >
                {primaryLabel}
              </Link>

              <Link
                href={secondaryHref}
                className={
                  buttonVariants({ variant: 'outline', size: 'lg' }) +
                  ' w-full border-brand-light-text/25 text-brand-light-text hover:bg-brand-light-text/10 sm:w-auto'
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
