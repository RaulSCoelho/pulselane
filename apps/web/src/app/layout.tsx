import './globals.css'

import { Providers } from '@/app/providers'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Pulselane',
  description: 'Operational SaaS for clients, projects and tasks.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground font-sans">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  )
}
