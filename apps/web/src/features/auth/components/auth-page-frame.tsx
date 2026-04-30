import type { ReactNode } from 'react'

type AuthPageFrameProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthPageFrame({ title, description, children }: AuthPageFrameProps) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)]">
      <section className="hidden min-h-screen flex-col justify-between bg-(--brand-dark-background) p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-3xl bg-accent text-base font-semibold text-accent-foreground">
            P
          </span>
          <div>
            <p className="font-brand text-lg font-semibold leading-tight">Pulselane</p>
            <p className="text-sm text-white/65">Operations workspace</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase text-white/55">Clients, projects and tasks</p>
          <h1 className="mt-4 font-brand text-[32px] font-semibold leading-tight tracking-normal">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-white/68">{description}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {['Tenant context', 'Audit trail', 'Role access'].map(item => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/75">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
