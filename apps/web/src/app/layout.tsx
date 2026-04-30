import './globals.css'

import { Providers } from '@/app/providers'
import favicon from '@pulselane/assets/favicon.png'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Pulselane',
  description: 'Operational SaaS for clients, projects and tasks.',
  icons: {
    icon: favicon.src,
    apple: favicon.src
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  )
}
