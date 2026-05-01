import { BrandLogo } from '@/components/brand/brand-logo'
import waveformBackdrop from '@pulselane/assets/elegant_waveforms_in_dark_gradient_backdrop.png'
import Image from 'next/image'
import type { ReactNode } from 'react'

type AuthPageFrameProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthPageFrame({ title, description, children }: AuthPageFrameProps) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-brand-dark-background p-10 text-brand-light-text lg:flex">
        <Image
          src={waveformBackdrop}
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-40"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-brand-dark-background/80" />

        <div className="relative z-10 flex flex-1 flex-col justify-between">
          <BrandLogo variant="dark" className="h-auto max-w-48" priority />

          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase text-brand-light-text/55">Clients, projects and tasks</p>
            <h1 className="mt-4 font-brand tracking-normal">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-brand-light-text/70">{description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Tenant context', 'Audit trail', 'Role access'].map(item => (
              <div
                key={item}
                className="rounded-lg border border-brand-dark-border bg-brand-dark-surface/70 p-4 text-brand-light-text/75"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
